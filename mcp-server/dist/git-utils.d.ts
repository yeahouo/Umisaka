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
export declare class GitHelper {
    private git;
    constructor(cwd?: string);
    getStatus(): Promise<GitStatus>;
    getDiff(file?: string): Promise<string>;
    getDiffStat(): Promise<string>;
    generateCommitMessage(changes: GitChange[]): string;
    addAll(): Promise<void>;
    commit(message: string): Promise<string>;
    push(): Promise<void>;
    autoCommit(): Promise<{
        success: boolean;
        message: string;
        commitHash?: string;
    }>;
}
//# sourceMappingURL=git-utils.d.ts.map