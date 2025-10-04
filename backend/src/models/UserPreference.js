const { DataTypes, Model } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

class UserPreference extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "users",
            key: "id",
          },
        },
        theme: {
          type: DataTypes.ENUM("light", "dark", "auto"),
          defaultValue: "dark",
          validate: {
            isIn: {
              args: [["light", "dark", "auto"]],
              msg: 'Tema deve ser "light", "dark" ou "auto"',
            },
          },
        },
        default_view: {
          type: DataTypes.ENUM("detailed", "summary"),
          defaultValue: "detailed",
          validate: {
            isIn: {
              args: [["detailed", "summary"]],
              msg: 'Visualização padrão deve ser "detailed" ou "summary"',
            },
          },
        },
        show_charts: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        notifications: {
          type: DataTypes.JSONB,
          defaultValue: {
            email: true,
            browser: true,
            budget_alerts: true,
            weekly_summary: true,
            monthly_report: true,
          },
        },
        language: {
          type: DataTypes.STRING(5),
          defaultValue: "pt-BR",
          validate: {
            is: {
              args: /^[a-z]{2}-[A-Z]{2}$/,
              msg: "Idioma deve estar no formato xx-XX (ex: pt-BR)",
            },
          },
        },
        currency: {
          type: DataTypes.STRING(3),
          defaultValue: "BRL",
          validate: {
            len: {
              args: [3, 3],
              msg: "Moeda deve ter 3 caracteres (ex: BRL, USD)",
            },
          },
        },
        date_format: {
          type: DataTypes.STRING,
          defaultValue: "DD/MM/YYYY",
        },
        number_format: {
          type: DataTypes.JSONB,
          defaultValue: {
            decimal_separator: ",",
            thousand_separator: ".",
          },
        },
        dashboard_widgets: {
          type: DataTypes.JSONB,
          defaultValue: {
            balance_card: true,
            recent_transactions: true,
            expense_chart: true,
            category_breakdown: true,
            monthly_comparison: true,
          },
        },
        default_transaction_view: {
          type: DataTypes.ENUM("list", "grid", "calendar"),
          defaultValue: "list",
        },
        items_per_page: {
          type: DataTypes.INTEGER,
          defaultValue: 20,
          validate: {
            isIn: {
              args: [[10, 20, 50, 100]],
              msg: "Items por página deve ser 10, 20, 50 ou 100",
            },
          },
        },
        budget_alert_threshold: {
          type: DataTypes.INTEGER,
          defaultValue: 80,
          validate: {
            min: {
              args: [0],
              msg: "Limite de alerta deve ser no mínimo 0",
            },
            max: {
              args: [100],
              msg: "Limite de alerta deve ser no máximo 100",
            },
          },
        },
        fiscal_year_start_month: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
          validate: {
            min: {
              args: [1],
              msg: "Mês de início do ano fiscal deve ser entre 1 e 12",
            },
            max: {
              args: [12],
              msg: "Mês de início do ano fiscal deve ser entre 1 e 12",
            },
          },
        },
      },
      {
        sequelize,
        modelName: "UserPreference",
        tableName: "user_preferences",
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
  }
}

module.exports = UserPreference;
