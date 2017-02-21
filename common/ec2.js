'use strict'

const aws = require('aws-sdk');
const ec2 = new aws.EC2({region: 'ap-northeast-1'});

/**
 * すべてのEC2インスタンスを取得します。<br />
 *
 * @return {Array} instanceId、state、name を格納したオブジェクトの配列
 */
module.exports.describeInstances = function*() {
  const params = {
    DryRun: false
  }
  try {
    const data = yield ec2.describeInstances(params).promise();
    return parseInstanceObj(data);
  } catch (err) {
    throw err;
  }
}

/**
 * 指定されたNameタグの着いたEC2インスタンスを取得します。<br />
 *
 * @param {String} name Nameタ
 * @return {Array} instanceId、state、name を格納したオブジェクトの配列
 */
module.exports.describeInstancesByName = function*(name) {
  if (!name) throw new Error();
  const params = {
    Filters: [
      {
        Name: 'tag-key',
        Values: ['Name']
      },
      {
        Name: 'tag-value',
        Values: [name]
      },
      {
        Name: 'tag-key',
        Values: ['slack']
      }
    ],
    DryRun: false
  }
  try {
    const data = yield ec2.describeInstances(params).promise();
    return parseInstanceObj(data);
  } catch (err) {
    throw err;
  }
}

/**
 * 指定されたインスタンスIDを起動します。<br />
 */
module.exports.startInstances = function*(instanceIds) {
  const params = {
    InstanceIds: instanceIds,
      DryRun: false
  }
  try {
    return yield ec2.startInstances(params).promise();
  } catch (err) {
    throw err;
  }
}

/**
 * 指定されたインスタンスIDを停止します。<br />
 */
module.exports.stopInstances = function*(instanceIds) {
  const params = {
    InstanceIds: instanceIds,
      DryRun: false
  }
  try {
    return yield ec2.stopInstances(params).promise();
  } catch (err) {
    throw err;
  }
}

/**
 * describeInstances で取得した結果をパースします。<br />
 * @param {Object} data describeInstances の戻り値
 * @return {Object} instanceId、state、name を格納したオブジェクトの配列
 */
function parseInstanceObj(data) {
  let instances = [];
  data.Reservations.forEach(reservation => {
    reservation.Instances.forEach(instance => {
      // Nameタグにサーバ名が設定されている前提でパースしています。
      let name = 'unknown server';
      if (instance.Tags.length > 0) {
        name = instance.Tags.reduce((prev, current) => {
          return current.Key === 'Name' ? current.Value : prev;
        }, instance.Tags[0].Value);
      }
      console.log('server name: ', name);
      instances.push({
        instanceId: instance.InstanceId,
        state: instance.State.Name,
        name : name
      });
    });
  });
  return instances;
}
