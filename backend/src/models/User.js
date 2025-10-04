const { DataTypes, Model } = require("sequelize");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

class User extends Model {
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
              msg: "Nome é obrigatório",
            },
            len: {
              args: [2, 100],
              msg: "Nome deve ter entre 2 e 100 caracteres",
            },
          },
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: {
            msg: "Este email já está cadastrado",
          },
          validate: {
            isEmail: {
              msg: "Email inválido",
            },
            notEmpty: {
              msg: "Email é obrigatório",
            },
          },
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: {
              msg: "Senha é obrigatória",
            },
            len: {
              args: [6, 100],
              msg: "Senha deve ter no mínimo 6 caracteres",
            },
          },
        },
        system_mode: {
          type: DataTypes.ENUM("empresa", "pessoal"),
          allowNull: false,
          defaultValue: "pessoal",
          validate: {
            isIn: {
              args: [["empresa", "pessoal"]],
              msg: 'Modo do sistema deve ser "empresa" ou "pessoal"',
            },
          },
        },
        role: {
          type: DataTypes.ENUM("super", "editor", "viewer"),
          allowNull: true,
          validate: {
            isIn: {
              args: [["super", "editor", "viewer"]],
              msg: 'Role deve ser "super", "editor" ou "viewer"',
            },
            isValidForSystemMode(value) {
              if (this.system_mode === "pessoal" && value !== null) {
                throw new Error("Usuários pessoais não podem ter role");
              }
              if (this.system_mode === "empresa" && value === null) {
                throw new Error("Usuários empresariais devem ter uma role");
              }
            },
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
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        last_login: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: "User",
        tableName: "users",
        hooks: {
          beforeSave: async (user) => {
            if (user.changed("password")) {
              const salt = await bcrypt.genSalt(10);
              user.password = await bcrypt.hash(user.password, salt);
            }
            // Converter email para lowercase
            if (user.email) {
              user.email = user.email.toLowerCase();
            }
          },
        },
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Company, {
      foreignKey: "company_id",
      as: "company",
    });
    this.hasMany(models.Category, {
      foreignKey: "user_id",
      as: "categories",
    });
    this.hasMany(models.Transaction, {
      foreignKey: "user_id",
      as: "transactions",
    });
    this.hasOne(models.UserPreference, {
      foreignKey: "user_id",
      as: "preferences",
    });
  }

  // Métodos de instância
  async checkPassword(password) {
    return bcrypt.compare(password, this.password);
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  }

  // Métodos para verificar permissões
  canEdit() {
    if (this.system_mode === "pessoal") return true;
    return ["super", "editor"].includes(this.role);
  }

  canDelete() {
    if (this.system_mode === "pessoal") return true;
    return this.role === "super";
  }

  isAdmin() {
    return this.role === "super";
  }
}

module.exports = User;
