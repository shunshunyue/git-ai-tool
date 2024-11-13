import VCS from './vcs.js';
import { exec } from 'child_process';
export default class SVNVCS extends VCS {
  constructor(projectPath) {
    super();
    this.projectPath = projectPath;
  }

  // 获取差异
  async getDiff() {
    return new Promise((resolve, reject) => {
      exec(`svn diff ${this.projectPath}`, (err, stdout, stderr) => {
        if (err) {
          reject(`执行 SVN diff 出错: ${stderr}`);
        } else {

          resolve(stdout); // 返回 diff 输出内容
        }
      });
    });
  }


  // 提交更改
  async commit(message) {
    return new Promise((resolve, reject) => {
      const command = `svn commit ${this.projectPath} -m "${message}"`;
      exec(command, (err, stdout, stderr) => {
        if (err) {
          reject('提交失败: ' + stderr);
        } else {
          resolve(stdout);  // 返回提交结果
        }
      });
    });
  }


  // 获取当前 SVN 用户名
  async getUserName() {
    return new Promise((resolve, reject) => {
      exec(`svn info ${this.projectPath}`, (err, stdout, stderr) => {
        if (err) {
          reject('获取 SVN 用户名失败');
        } else {
          const match = stdout.match(/Last Changed Author: (\S+)/);
          console.log("用户名====", match[1],)
          resolve(match ? match[1] : 'Unknown');
        }
      });
    });
  }
  // 获取提交记录
  async getLogs(since, until) {
    return new Promise((resolve, reject) => {
      const command = `svn log ${this.projectPath} -r {${since}}:{${until}}`;  // SVN 的时间格式是 {YYYY-MM-DD}
      exec(command, (err, stdout, stderr) => {
        if (err) {
          reject('执行 SVN log 出错: ' + stderr);
        } else {
          const logs = stdout.split('\n').filter(line => line.trim().length > 0);
          const formattedLogs = logs.map(log => {
            const parts = log.split('|');
            return `${parts[0]} - ${parts[1]}: ${parts[2]}`;  // 获取版本号、提交者、提交信息
          }).join('\n');
          resolve(formattedLogs);
        }
      });
    });
  }
}
