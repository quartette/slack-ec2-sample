'use strict';

const co = require('co');
const _ = require('lodash');
const ec2 = require('../common/ec2');
const util = require('../common/util');

const usage = 'usage: $server (status | help | [server name] start | [server name] stop)';
// KMS等で暗号化してください。
const slackToken = 'xxxxxxxxxxxxxxxxxxxxxxxx';

/**
 * トークンのチェック<br />
 * slackからのリクエストに含まれるtokenを検証します。<br />
 * 必要に応じて他の項目もチェックしてください。<br />
 *
 * @param {String} token リクエスト内に含まれるtoken文字列
 * @return {Boolean}
 */
function validateToken(token) {
  return (slackToken === token);
}

/**
 * slackからの送信内容を検証します。
 *
 * @param {String} text slack経由で投稿された文字列
 */
function validateSlackText(text) {
  if (!text) throw new Error(`invalid parameter\n${usage}`);
  const args = text.split('+');
  if (args.length < 2) throw new Error(`invalid parameter\n${usage}`);
  return args;
}

/**
 * slackからの引数に応じて各処理を実行します。
 *
 * @param {Object} body リクエストボディ
 */
function *exectProcess(body) {
  const args = validateSlackText(body.text);
  if (args[1] === 'help') {
    return usage;
  } else if (args[1] === 'status') {
    return yield instanceStatus();
  }
  // サーバの起動、停止
  return yield runInstance(args);
}

/**
 * インスタンスの起動、停止を行います。
 *
 * @param {Array} args slackからのパラメータ引数
 */
function *runInstance(args) {
  if (!args[2] || (args[2] !== 'start' && args[2] !== 'stop')) throw new Error(`invalid parameter\n${usage}`);
  const instance = yield fetchInstance(args[1]);
  if (instance.length < 1) throw new Error(`${args[1]} server does not exist. or unauthorized ${args[2]} instance`);
  if (args[2] === 'start') {
    yield ec2.startInstances([instance[0].instanceId]);
  } else {
    yield ec2.stopInstances([instance[0].instanceId]);
  }
  return `${args[2]} instance ${args[1]}`;
}

/**
 * 指定されたNameタグのインスタンスを取得します。<br />
 *
 * @param {String} name Nameタグ名
 * @return {Array} instanceId、state、name を格納したオブジェクトの配列
 */
function *fetchInstance(name) {
  return yield ec2.describeInstancesByName(name);
}

/**
 * インスタンスの状態を取得します。<br />
 *
 * @return {String} AWS上のインスタンス名、及びstate(running|stopped|pending)の文字列
 */
function *instanceStatus() {
  const instances = yield ec2.describeInstances();
  let text = `\n`;
  instances.forEach(instance => {
    text = `${text}${instance.name}: ${instance.state}\n`;
  });
  return text;
}

/**
 * slackから受け取ったメッセージを元にEC2インスタンスの状態取得や起動、停止を行います。
 *
 */
module.exports.slack = (event, context, cb) => {
  console.log(JSON.stringify(event));
  const body = util.parseRequestBody(event);
  if (!validateToken(body.token)) {
    console.log('invalid token');
    return context.done()
  };
  let text = `@${body.user_name}`;
  co(function*() {
    try {
      const result = yield exectProcess(body);
      text = `${text} ${result}`;
    } catch (err) {
      text = `${text} ${err.message}`;
    }

    const response_body = {
      text: text,
      link_names: '1'
    };
    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json;charset=UTF-8'
      },
      body: JSON.stringify(response_body)
    };
    return cb(null, response);
  });
}
