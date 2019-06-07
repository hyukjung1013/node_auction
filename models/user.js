module.exports = (sequelize, DataTypes) => (
    sequelize.define('user', {
        email: {
            type: DataTypes.STRING(40),
            allowNull: true,
            unique: false
        },
        nickname: {
            type: DataTypes.STRING(15),
            allowNull: false
        },
        name: {
            type: DataTypes.STRING(15),
            allowNull: true
        },
        password: {
            type: DataTypes.STRING(100),
            allowNull: true
        }
    }, {
        timestamps: true,
        paranoid: true
    })
);