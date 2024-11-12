const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const simpleGit = require('simple-git');
const git = simpleGit();


async function generateCommitMessage(diffContent) {
  const apiKey = process.env.API_KEY;
  const prompt = `根据以下 git diff 内容生成一条简洁的 commit 信息：\n\n${diffContent}\n\nCommit message:`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });




    const result = await model.generateContent(prompt);
    console.log(result.response.text());
  } catch (error) {
    console.error('Error generating commit message:', error);
    return null;
  }
}


// 获取 git diff 内容
async function getGitDiff() {
  try {
    const diff = await git.diff(['--cached']);
    return diff;
  } catch (error) {
    console.error('Error fetching git diff:', error);
    return null;
  }
}

// 主程序
async function main() {
  const diffContent = await getGitDiff();
  console.log(diffContent, "diffContentdiffContent")
  if (diffContent) {
    console.log('Git diff 内容：\n', diffContent);

    const commitMessage = await generateCommitMessage(diffContent);
    if (commitMessage) {
      console.log('生成的 commit 信息：\n', commitMessage);

      const confirm = prompt('是否使用此提交信息？(y/n): ');
      if (confirm === 'y') {
        await git.commit(commitMessage);
        console.log('提交成功');
      } else {
        console.log('提交已取消');
      }
    }
  }
}

main()