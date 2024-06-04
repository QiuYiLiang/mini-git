const fs = require("fs");
function generateDiff(oldContent, newContent) {
  const oldData = oldContent.split(/\r?\n/);
  const newData = newContent.split(/\r?\n/);

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
      if (first && first.type === "EQ") {
        first.length++;
      } else {
        diff.unshift({ type: "EQ", length: 1 });
      }
      i--;
      j--;
    } else if (
      j < 0 ||
      (i >= 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j]))
    ) {
      diff.unshift({ type: "DEL", value: oldData[i] });
      i--;
    } else {
      diff.unshift({ type: "ADD", value: newData[j] });
      j--;
    }
  }

  return diff;
}

function applyDiff(content, diff) {
  const data = [...content.split(/\r?\n/)];
  const resData = [];
  for (let index = 0; index < diff.length; index++) {
    const { type, length, value } = diff[index];
    switch (type) {
      case "EQ":
        resData.push(...data.splice(0, length));
        break;
      case "DEL":
        data.shift();
        break;
      case "ADD":
        resData.push(value);
        break;
    }
  }
  return resData.join('\r\n');
}

function getRollbackDiff(diff) {
  const rollbackDiff = [];
  for (let i = 0; i < diff.length; i++) {
    const { type, length, value } = diff[i];
    switch (type) {
      case "EQ":
        rollbackDiff.push({ type: "EQ", length });
        break;
      case "DEL":
        rollbackDiff.push({ type: "ADD", value });
        break;
      case "ADD":
        rollbackDiff.push({ type: "DEL", value });
        break;
    }
  }
  return rollbackDiff;
}
const diff = generateDiff(
  fs.readFileSync("./a", "utf-8"),
  fs.readFileSync("./a2", "utf-8")
);

const a2 = applyDiff(fs.readFileSync("./a", "utf-8"), diff);

const a = applyDiff(fs.readFileSync("./a2", "utf-8"), getRollbackDiff(diff));

fs.writeFileSync('./a.txt', a)
fs.writeFileSync('./a2.txt', a2)
console.log(diff);
