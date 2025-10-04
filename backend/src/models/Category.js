const { DataTypes, Model } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

class Category extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: () => uuidv4(),
          primaryKey: true,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: {
              msg: "Nome da categoria é obrigatório",
            },
            len: {
              args: [2, 100],
              msg: "Nome deve ter entre 2 e 100 caracteres",
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
        budget: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
          validate: {
            isDecimal: {
              msg: "Orçamento deve ser um valor numérico",
            },
            min: {
              args: [0],
              msg: "Orçamento não pode ser negativo",
            },
          },
        },
        month: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
            isInt: {
              msg: "Mês deve ser um número inteiro",
            },
            min: {
              args: [1],
              msg: "Mês deve ser entre 1 e 12",
            },
            max: {
              args: [12],
              msg: "Mês deve ser entre 1 e 12",
            },
          },
        },
        is_punctual: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: true,
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
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        color: {
          type: DataTypes.STRING(7),
          allowNull: true,
          validate: {
            is: {
              args: /^#[0-9A-F]{6}$/i,
              msg: "Cor deve estar no formato hexadecimal (#RRGGBB)",
            },
          },
        },
        icon: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
      },
      {
        sequelize,
        modelName: "Category",
        tableName: "categories",
        hooks: {
          beforeValidate: (category) => {
            // Se é pontual, garantir que não tem mês
            if (category.is_punctual === true) {
              category.month = null;
            }
            // Se não é pontual e não tem mês, definir mês atual
            if (category.is_punctual === false && !category.month) {
              category.month = new Date().getMonth() + 1;
            }
          },
        },
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });

    this.belongsTo(models.Company, {
      foreignKey: "company_id",
      as: "company",
    });

    this.hasMany(models.Transaction, {
      foreignKey: "category_id",
      as: "transactions",
    });
  }

  // Método para calcular o total gasto/recebido
  async calculateTotal(startDate, endDate) {
    const { Transaction } = require("./index");
    const { Op } = require("sequelize");

    const result = await Transaction.sum("amount", {
      where: {
        category_id: this.id,
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    return result || 0;
  }

  // Método para calcular percentual do orçamento usado
  async calculateBudgetPercentage(startDate, endDate) {
    if (this.budget === 0) return 0;

    const total = await this.calculateTotal(startDate, endDate);
    return (total / this.budget) * 100;
  }
}

module.exports = Category;
