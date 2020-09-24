const _ = require('lodash');
const Koa = require('koa');
const compress = require('koa-compress');
const helmet = require('koa-helmet');
const axios = require('axios');
const reachable = require('is-reachable');
const SocksAgent = require('axios-socks5-agent');

const app = new Koa();

app
  .use(compress())
  .use(helmet())
  .use(async (ctx) => {
    const data = await Promise.all(
      [
        axios.get('https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt'),
        axios.get('https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/socks5.txt'),
        axios.get('https://www.proxyscan.io/download?type=socks5'),
      ],
    );
    const socks5 = _
      .chain(data)
      .flattenDeep()
      .map('data')
      .join('\n')
      .split('\n')
      .filter()
      .uniq()
      .value();
    const stats = await Promise.all(socks5.map(reachable));
    console.log(stats.filter(Boolean).length)
    const servers = await Promise.all(
      socks5
        .filter((sock, index) => stats[index])
        .map((server) => {
          const [host, port] = server.split(':');
          const { httpAgent, httpsAgent } = new SocksAgent({ host, port });
          const options = {
            httpAgent,
            httpsAgent,
            timeout: 3000,
          }

          return axios
            .get('https://www.google.com', options)
            .then(() => server)
            .catch(() => false);
        }),
    );

    ctx.body = servers.filter(Boolean).join('\n');
  })
  .listen(3000);