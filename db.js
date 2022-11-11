const { Sequelize, DataTypes } = require("sequelize");

// 从环境变量中读取数据库配置
const { MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_ADDRESS = "" } = process.env;

const [host, port] = MYSQL_ADDRESS.split(":");

const sequelize = new Sequelize("nodejs_demo", MYSQL_USERNAME, MYSQL_PASSWORD, {
  host,
  port,
  dialect: "mysql" /* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */,
});

// 定义数据模型
const Counter = sequelize.define("Counter", {
  count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});

const User = sequelize.define("User", {
	id: {
	  type: Sequelize.INTEGER, // 要与数据库声明的类型匹配
	  autoIncrementIdentity: true, // 自增
	  primaryKey: true, // 主键
	},
	openid: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    createTime: {
      type: Sequelize.DATE,
      allowNull: true,
    },
	count: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 1,
	},
});

// 数据库初始化方法
async function init() {
  await Counter.sync({ alter: true });
  await User.sync({ alter: true });
}

// 导出初始化方法和模型
module.exports = {
  init,
  Counter,
  User,
};
