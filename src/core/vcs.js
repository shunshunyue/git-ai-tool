

export default class VCS {
  // 获取 Git 或 SVN 的差异内容
  async getDiff() {
    throw new Error('Method getDiff must be implemented');
  }

  // 提交变更
  async commit(message) {
    throw new Error('Method commit must be implemented');
  }

  // 获取当前用户名
  async getUserName() {
    throw new Error('Method getUserName must be implemented');
  }
  // 获取提交记录
  async getLogs(since, until) {
    throw new Error('Method getLogs must be implemented');
  }
}
