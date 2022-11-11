const Koa = require("koa");
const Router = require("koa-router");
const logger = require("koa-logger");
const bodyParser = require("koa-bodyparser");
const fs = require("fs");
const path = require("path");
const { init: initDB, Counter, User } = require("./db");

const router = new Router();

const homePage = fs.readFileSync(path.join(__dirname, "index.html"), "utf-8");

const MpUploadOssHelper = require("./oss/uploadOssHelper.js");

router.get("/getPostObjectParams", async (ctx) => {
  const mpHelper = new MpUploadOssHelper({
    // 阿里云账号AccessKey拥有所有API的访问权限，风险很高。强烈建议您创建并使用RAM用户进行API访问或日常运维，请登录RAM控制台创建RAM用户。
    accessKeyId: process.env.oss_accessKeyId,
    accessKeySecret: process.env.oss_accessKeySecret,
    // 限制参数的生效时间，单位为小时，默认值为1。
    timeout: 1,
    // 限制上传文件大小，单位为MB，默认值为10。
    maxSize: 50,
  });

  // 生成参数。
  const params = mpHelper.createUploadParams();
  ctx.body = params
});

// 首页
router.get("/", async (ctx) => {
  ctx.body = homePage;
});

// 更新计数
router.post("/api/count", async (ctx) => {
  const { request } = ctx;
  const { action } = request.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }

  ctx.body = {
    code: 0,
    data: await Counter.count(),
  };
});

// 获取计数
router.get("/api/count", async (ctx) => {
  const result = await Counter.count();

  ctx.body = {
    code: 0,
    data: result,
  };
});

// 小程序调用，获取微信 Open ID
router.get("/api/login", async (ctx) => {
  if (ctx.request.headers["x-wx-source"]) {
    const openid = ctx.request.headers["x-wx-openid"];
	let user = getUser(openid);
	if (user) {
		ctx.body = {
		  code: 0,
		  message: 'succ',
		  user: user,
		}
	} else {
		ctx.body = {
		  code: -1,
		  message: 'user not found'
		}
	}
  } else {
	ctx.body = {
      code: -1,
      message: 'unknown source',
	}
  }
});

// 获取用户信息
async function getUser(openid) {
	if (!openid) {
		return null
	}
	let user = null;
	user = await User.findOne({ where: { openid } });
	// 用户不存在，新增用户
	if (!user) {
		await addUser(openid);
		user = await User.findOne({ where: { openid } });
	}
	return user;
}

// 新增用户
async function addUser(openid) {
  await User.create({ openid, createTime: new Date().toLocaleString(), count: 10 });
}

const app = new Koa();
app
  .use(logger())
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods());

const port = process.env.PORT || 80;
async function bootstrap() {
  await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}
bootstrap();
