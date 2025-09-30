import { simpleGit, SimpleGit } from 'simple-git';
import * as path from 'path';

export interface GitChange {
  type: 'modified' | 'added' | 'deleted' | 'renamed';
  file: string;
  status: string;
}

export interface GitStatus {
  hasChanges: boolean;
  changes: GitChange[];
  branch: string;
}

export class GitHelper {
  private git: SimpleGit;

  constructor(cwd: string = process.cwd()) {
    this.git = simpleGit(cwd);
  }

  async getStatus(): Promise<GitStatus> {
    try {
      const status = await this.git.status();
      const changes: GitChange[] = [];

      // 处理修改的文件
      status.modified.forEach(file => {
        changes.push({ type: 'modified', file, status: 'M' });
      });

      // 处理新增的文件
      status.created.forEach(file => {
        changes.push({ type: 'added', file, status: 'A' });
      });

      // 处理删除的文件
      status.deleted.forEach(file => {
        changes.push({ type: 'deleted', file, status: 'D' });
      });

      // 处理重命名的文件
      status.renamed.forEach(file => {
        changes.push({ type: 'renamed', file: `${file.from} → ${file.to}`, status: 'R' });
      });

      return {
        hasChanges: changes.length > 0,
        changes,
        branch: status.current || 'unknown'
      };
    } catch (error) {
      throw new Error(`获取 Git 状态失败: ${error}`);
    }
  }

  async getDiff(file?: string): Promise<string> {
    try {
      if (file) {
        return await this.git.diff([file]);
      }
      return await this.git.diff();
    } catch (error) {
      throw new Error(`获取 Git diff 失败: ${error}`);
    }
  }

  async getDiffStat(): Promise<string> {
    try {
      return await this.git.diff(['--stat']);
    } catch (error) {
      throw new Error(`获取 Git diff stat 失败: ${error}`);
    }
  }

  generateCommitMessage(changes: GitChange[]): string {
    if (changes.length === 0) {
      return '样式调整和代码优化';
    }

    const fileTypes = {
      markdown: 0,
      typescript: 0,
      javascript: 0,
      json: 0,
      css: 0,
      config: 0,
      other: 0
    };

    changes.forEach(change => {
      const ext = path.extname(change.file).toLowerCase();
      if (['.md', '.markdown'].includes(ext)) {
        fileTypes.markdown++;
      } else if (['.ts'].includes(ext)) {
        fileTypes.typescript++;
      } else if (['.js', '.jsx'].includes(ext)) {
        fileTypes.javascript++;
      } else if (['.json'].includes(ext)) {
        fileTypes.json++;
      } else if (['.css', '.scss', '.less'].includes(ext)) {
        fileTypes.css++;
      } else if (['.toml', '.yaml', '.yml', '.ini', '.config'].some(configExt => change.file.includes(configExt))) {
        fileTypes.config++;
      } else {
        fileTypes.other++;
      }
    });

    const messages = [];

    if (fileTypes.markdown > 0) {
      messages.push('更新文档');
    }
    if (fileTypes.typescript > 0 || fileTypes.javascript > 0) {
      messages.push('优化代码');
    }
    if (fileTypes.json > 0 || fileTypes.config > 0) {
      messages.push('更新配置');
    }
    if (fileTypes.css > 0) {
      messages.push('调整样式');
    }
    if (fileTypes.other > 0) {
      messages.push('其他修改');
    }

    return messages.length > 0 ? messages.join('，') : '代码优化和样式调整';
  }

  async addAll(): Promise<void> {
    try {
      await this.git.add('.');
    } catch (error) {
      throw new Error(`添加文件失败: ${error}`);
    }
  }

  async commit(message: string): Promise<string> {
    try {
      const result = await this.git.commit(message);
      return (result as any).hash || 'unknown';
    } catch (error) {
      throw new Error(`提交失败: ${error}`);
    }
  }

  async push(): Promise<void> {
    try {
      await this.git.push();
    } catch (error) {
      throw new Error(`推送失败: ${error}`);
    }
  }

  async autoCommit(): Promise<{ success: boolean; message: string; commitHash?: string }> {
    try {
      const status = await this.getStatus();

      if (!status.hasChanges) {
        return {
          success: false,
          message: '没有检测到任何更改，无需提交'
        };
      }

      const commitMessage = this.generateCommitMessage(status.changes);

      await this.addAll();
      const commitHash = await this.commit(commitMessage);

      try {
        await this.push();
        return {
          success: true,
          message: `✅ 成功提交并推送: "${commitMessage}"`,
          commitHash
        };
      } catch (pushError) {
        return {
          success: true,
          message: `✅ 成功提交: "${commitMessage}" (推送失败，但本地提交成功)`,
          commitHash
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `❌ 自动提交失败: ${error}`
      };
    }
  }
}