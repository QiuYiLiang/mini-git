const fs = require("fs");
const zlib = require("zlib");

const TYPE = {
  EQ: 0,
  ADD: 1,
  DEL: 2,
};

function generateDiff(oldContext, newContext) {
  const oldData = oldContext.split(/\r?\n/);
  const newData = newContext.split(/\r?\n/);

  const M = oldData.length;
  const N = newData.length;

  const matrix = Array.from({ length: M }, () => Array(N).fill(0));

  for (let i = 0; i < M; i++) {
    for (let j = 0; j < N; j++) {
      if (oldData[i] === newData[j]) {
        matrix[i][j] = i > 0 && j > 0 ? matrix[i - 1][j - 1] + 1 : 1;
      } else {
        matrix[i][j] = Math.max(
          i > 0 ? matrix[i - 1][j] : 0,
          j > 0 ? matrix[i][j - 1] : 0
        );
      }
    }
  }

  let i = M - 1;
  let j = N - 1;
  const diff = [];

  while (i >= 0 || j >= 0) {
    const first = diff[0];
    if (i >= 0 && j >= 0 && oldData[i] === newData[j]) {
      if (first && first.type === TYPE.EQ) {
        first.length++;
      } else {
        diff.unshift([TYPE.EQ, 1]);
      }
      i--;
      j--;
    } else if (
      j < 0 ||
      (i >= 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j]))
    ) {
      diff.unshift([TYPE.DEL, oldData[i]]);
      i--;
    } else {
      diff.unshift([TYPE.ADD, newData[j]]);
      j--;
    }
  }

  return zlib.gzipSync(JSON.stringify(diff));
}

function applyDiff(content, diffBuffer) {
  const diff = JSON.parse(zlib.gunzipSync(diffBuffer));
  const data = [...content.split(/\r?\n/)];
  const resData = [];
  for (let index = 0; index < diff.length; index++) {
    const [type, value] = diff[index];
    switch (type) {
      case TYPE.EQ:
        resData.push(...data.splice(0, value));
        break;
      case TYPE.DEL:
        data.shift();
        break;
      case TYPE.ADD:
        resData.push(value);
        break;
    }
  }
  return resData.join("\r\n");
}

function getRollbackDiff(diffBuffer) {
  const diff = JSON.parse(zlib.gunzipSync(diffBuffer));
  console.log(diff);
  const rollbackDiff = [];
  for (let i = 0; i < diff.length; i++) {
    const [type, value] = diff[i];
    switch (type) {
      case TYPE.EQ:
        rollbackDiff.push([TYPE.EQ, value]);
        break;
      case TYPE.DEL:
        rollbackDiff.push([TYPE.ADD, value]);
        break;
      case TYPE.ADD:
        rollbackDiff.push([TYPE.DEL, value]);
        break;
    }
  }
  return zlib.gzipSync(JSON.stringify(rollbackDiff));
}

const diff = generateDiff(
  fs.readFileSync("./a", "utf-8"),
  fs.readFileSync("./a2", "utf-8")
);

const a2 = applyDiff(fs.readFileSync("./a", "utf-8"), diff);

const a = applyDiff(fs.readFileSync("./a2", "utf-8"), getRollbackDiff(diff));

fs.writeFileSync("./a.js", a);
fs.writeFileSync("./a2.js", a2);
