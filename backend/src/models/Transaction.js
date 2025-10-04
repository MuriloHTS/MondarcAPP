const { DataTypes, Model, Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

class Transaction extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: () => uuidv4(),
          primaryKey: true,
          allowNull: false,
        },
        category_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "categories",
            key: "id",
          },
        },
        amount: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          validate: {
            isDecimal: {
              msg: "Valor deve ser um número válido",
            },
            notNull: {
              msg: "Valor é obrigatório",
            },
            min: {
              args: [0.01],
              msg: "Valor deve ser maior que zero",
            },
          },
        },
        description: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: {
              msg: "Descrição é obrigatória",
            },
            len: {
              args: [2, 255],
              msg: "Descrição deve ter entre 2 e 255 caracteres",
            },
          },
        },
        date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          validate: {
            isDate: {
              msg: "Data inválida",
            },
            notNull: {
              msg: "Data é obrigatória",
            },
          },
        },
        type: {
          type: DataTypes.ENUM("income", "expense"),
          allowNull: false,
          validate: {
            isIn: {
              args: [["income", "expense"]],
              msg: 'Tipo deve ser "income" ou "expense"',
            },
          },
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "users",
            key: "id",
          },
        },
        company_id: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: "companies",
            key: "id",
          },
        },
        created_by: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "users",
            key: "id",
          },
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        tags: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          defaultValue: [],
        },
        attachments: {
          type: DataTypes.JSONB,
          defaultValue: [],
        },
        recurring: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        recurring_config: {
          type: DataTypes.JSONB,
          allowNull: true,
          validate: {
            isValidConfig(value) {
              if (this.recurring && !value) {
                throw new Error(
                  "Configuração de recorrência é obrigatória para transações recorrentes"
                );
              }
              if (value && !this.recurring) {
                throw new Error(
                  "Configuração de recorrência só pode ser definida para transações recorrentes"
                );
              }
            },
          },
        },
        status: {
          type: DataTypes.ENUM("pending", "completed", "cancelled"),
          defaultValue: "completed",
        },
      },
      {
        sequelize,
        modelName: "Transaction",
        tableName: "transactions",
        hooks: {
          beforeValidate: async (transaction) => {
            // Verificar se o tipo da transação corresponde ao tipo da categoria
            if (transaction.category_id) {
              const Category = sequelize.models.Category;
              const category = await Category.findByPk(transaction.category_id);

              if (category && category.type !== transaction.type) {
                throw new Error(
                  `Tipo da transação (${transaction.type}) não corresponde ao tipo da categoria (${category.type})`
                );
              }
            }
          },
        },
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Category, {
      foreignKey: "category_id",
      as: "category",
    });

    this.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });

    this.belongsTo(models.User, {
      foreignKey: "created_by",
      as: "creator",
    });

    this.belongsTo(models.Company, {
      foreignKey: "company_id",
      as: "company",
    });
  }

  // Métodos estáticos para análises
  static async getMonthlyTotal(userId, companyId, month, year, type = null) {
    const { Op } = require("sequelize");
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const where = {
      date: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (userId) where.user_id = userId;
    if (companyId) where.company_id = companyId;
    if (type) where.type = type;

    return (await this.sum("amount", { where })) || 0;
  }

  static async getByCategory(userId, companyId, startDate, endDate) {
    const { Op } = require("sequelize");
    const where = {
      date: {
        [Op.between]: [startDate, endDate],
      },
    };

    if (userId) where.user_id = userId;
    if (companyId) where.company_id = companyId;

    return await this.findAll({
      where,
      include: [
        {
          model: this.sequelize.models.Category,
          as: "category",
          attributes: ["id", "name", "type", "budget"],
        },
      ],
      attributes: [
        "category_id",
        [this.sequelize.fn("SUM", this.sequelize.col("amount")), "total"],
      ],
      group: ["category_id", "category.id"],
      raw: true,
    });
  }
}

module.exports = Transaction;
