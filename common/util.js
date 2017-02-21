'use strict';

/**
 * @param {Object} event Lambdaで受け取ったeventオブジェクト
 * @return {Object} request bodyをオブジェクトに変換したもの
 *
 * request bodyの値をパースします。
 * Json文字列、クエリパラメータ形式がパース可能です。
 * パースできない場合、空のオブジェクトを返します。
 */
module.exports.parseRequestBody = (event) => {
  let body = {};
  if (!event.body) {
    return body;
  }
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    console.log('not json string ', event.body);
    try {
      body = parseBody(event.body);
    } catch (err2) {
      console.error('unable to parse request body ', event.body, err2);
    }
  }
  return body;
}

/**
 * @param {Object} reqestBody request bodyオブジェクト
 * @return {Object} bodyのStringをオブジェクトに変換したもの
 *
 * request bodyをパースします
 */
const parseBody = (requestBody) => {
  let body = {};
  requestBody.split('&').forEach(value => {
    const param = value.split('=');
    body[param[0]] = decodeURIComponent( param[1] );
  });
  return body;
}
