const Koa = require('koa');
const compress = require('koa-compress');
const helmet = require('koa-helmet');
const axios = require('axios');
const reachable = require('is-reachable');

const app = new Koa();

app
  .use(compress())
  .use(helmet())
  .use(async (ctx) => {
    const data = await axios.get('https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt');
    const socks5 = data.data.split('\n').filter(Boolean);
    const stats = await Promise.all(socks5.map(reachable));

    ctx.body = socks5.filter((sock, index) => stats[index]).join('\n');
  })
  .listen(3000);