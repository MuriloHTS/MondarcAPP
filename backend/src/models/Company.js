const { DataTypes, Model } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

class Company extends Model {
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
              msg: "Nome da empresa é obrigatório",
            },
            len: {
              args: [2, 200],
              msg: "Nome da empresa deve ter entre 2 e 200 caracteres",
            },
          },
        },
        cnpj: {
          type: DataTypes.STRING(18), // 00.000.000/0000-00
          allowNull: true,
          unique: {
            msg: "Este CNPJ já está cadastrado",
          },
          validate: {
            is: {
              args: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
              msg: "CNPJ deve estar no formato 00.000.000/0000-00",
            },
          },
        },
        email: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: {
            isEmail: {
              msg: "Email inválido",
            },
          },
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        settings: {
          type: DataTypes.JSONB,
          defaultValue: {
            fiscal_year_start: 1, // Janeiro
            currency: "BRL",
            timezone: "America/Sao_Paulo",
          },
        },
      },
      {
        sequelize,
        modelName: "Company",
        tableName: "companies",
      }
    );
  }

  static associate(models) {
    this.hasMany(models.User, {
      foreignKey: "company_id",
      as: "users",
    });
    this.hasMany(models.Category, {
      foreignKey: "company_id",
      as: "categories",
    });
    this.hasMany(models.Transaction, {
      foreignKey: "company_id",
      as: "transactions",
    });
  }
}

module.exports = Company;
