#!/usr/bin/env node
import { GoogleGenerativeAI } from '@google/generative-ai';
import readline from 'readline';
import chalk from 'chalk';
import { createVCS } from './core/vcsFactory.js';  // 引入工厂方法来处理 Git 和 SVN 的解耦
import { config } from './../config.js';


// 创建 readline 接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 生成提交信息
async function generateCommitMessage(diffContent) {
  const apiKey = config.API_KEY;
  const apiModel = config.API_MODEL;
  const commitRule = config?.commitRule || `
      正确格式:<type>(<scope>):<subject>
       示例:docs:更新 README，添加开发者部分
       type
         feat:产品新功能:通常是能够让用户觉察到的变化，小到文案或样式修改
         fix:修复 bug
         docs:更新文档或注释
         style:代码格式调整，对逻辑无影响:比如为按照 eslint 或团队风格修改代码格式。注意不是 UI 变更
         test:单测相关变更
         refactor:重构:不影响现有功能或添加功能。比如文件、变量重命名，代码抽象为函数，消除魔法数字等
         chore:杂项 其他无法归类的变更，比如代码合并chore
         perf:性能提升变更
         ci:持续集成相关变更
         build:代码构建相关变更:比如修复部署时的构建问题、构建脚本 webpack 或 qulp 
         temp相关变更临时代码:不计入 CHANGELOG，比如必须部署到某种环境才能测试的变更
       scope:可选。变更范围(细粒度要合适，并在一个项目中保持一致):比如页面名、模块名、或组件名
       subject:此次变更的简短描述，必须采用现在时态，如果是英语则首字母不能大写，句尾不加句号`;

  const prompt = `根据以下版本控制差异内容生成一条符合此规则${commitRule}只有中文的简洁的 commit 信息,\n\n${diffContent}\n\n`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: apiModel });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating commit message:', error);
    return null;
  }
}

// 询问是否使用生成的提交信息
function askQuestion(query) {
  return new Promise(resolve => {
    rl.question(query, answer => {
      resolve(answer.toLowerCase());
    });
  });
}

// 主程序
async function main() {
  console.log(chalk.blue.bold('--- 自动生成提交信息工具 ---'));

  // 询问用户选择版本控制系统
  const vcsType = await askQuestion(chalk.magenta('请选择版本控制系统 (git/svn): '));

  // 获取当前项目路径
  const projectPath = process.cwd();
  const vcs = createVCS(vcsType, projectPath);

  // 如果是 Git，执行 git add . 将更改添加到暂存区
  if (vcsType === 'git') {
    await vcs.stageChanges();  // 对 Git 执行添加更改操作
  }

  // 获取差异内容
  console.log(chalk.green('正在获取修改内容...\n'));
  const diffContent = await vcs.getDiff();
  if (diffContent) {
    console.log(chalk.green('\n正在使用 AI 生成提交信息...\n'));
    const commitMessage = await generateCommitMessage(diffContent);

    if (commitMessage) {
      console.log(chalk.cyan.bold('生成的提交信息：\n'), chalk.green(commitMessage));

      // 询问用户是否使用此提交信息
      const answer = await askQuestion(chalk.magenta('是否使用此提交信息？(y/n): '));
      if (answer === 'y') {
        await vcs.commit(commitMessage);
        console.log(chalk.green.bold('\n提交成功！🎉'));
      } else {
        console.log(chalk.red('\n提交已取消。'));
      }
    }
  } else {
    console.error(chalk.red('没有获取到任何修改内容。'));
  }

  rl.close();  // 关闭 readline 接口
}

main();
