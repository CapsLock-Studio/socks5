const _ = require('lodash');
const fs = require('fs');
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
        axios.get('https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks5.txt'),
        axios.get('https://www.proxyscan.io/download?type=socks5'),
      ],
    );
    const static = fs.readFileSync(`${__dirname}/socks5.txt`).toString();
    const socks5 = _
      .chain(data)
      .flattenDeep()
      .map('data')
      .concat(static)
      .join('\n')
      .split('\n')
      .map(ip => ip.trim())
      .filter((ip) => /^\d+\.\d+\.\d+\.\d+:\d+$/.test(ip))
      .uniq()
      .value();

    const stats = await Promise.all(socks5.map(reachable));
    const servers = await Promise.allSettled(
      socks5
        .filter((sock, index) => stats[index])
        .map((server) => {
          const [host, port] = server.split(':');
          const agent = new SocksAgent({ host, port });
          const options = {
            ...agent,
            timeout: 3000,
          }

          return axios
            .get('https://www.instagram.com/michael34435/?__a=1', options)
            .then((response) => {
              if (_.isObject(response.data)) {
                return server;
              }

              return false;
            });
        }),
    );

    ctx.body = _
      .chain(servers)
      .map('value')
      .filter()
      .join('\n')
      .value();
  })
  .listen(3000);