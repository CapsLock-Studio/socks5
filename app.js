const Koa = require('koa');
const compress = require('koa-compress');
const helmet = require('koa-helmet');
const axios = require('axios');
const reachable = require('is-reachable');
const SocksAgent = require('axios-socks5-agent')

const app = new Koa();

app
  .use(compress())
  .use(helmet())
  .use(async (ctx) => {
    const data = await axios.get('https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt');
    const socks5 = data.data.split('\n').filter(Boolean);
    const stats = await Promise.all(socks5.map(reachable));
    const servers = await Promise.all(
      socks5
        .filter((sock, index) => stats[index])
        .map((server) => {
          const [host, port] = server.split(':');
          const { httpAgent, httpsAgent } = new SocksAgent({ host, port });

          return axios
            .get('https://www.google.com', { httpAgent, httpsAgent, timeout: 5000 })
            .then(() => server)
            .catch(() => false);
        }),
    );

    ctx.body = servers.filter(Boolean).join('\n');
  })
  .listen(3000);