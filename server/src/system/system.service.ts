import { Injectable } from '@nestjs/common';

@Injectable()
export class SystemService {
  // This will be manually updated when a new version is released
  private readonly latestVersion = '1.0.3';
  private readonly githubOwner = 'saibbyweb'; // Replace with your actual GitHub username
  private readonly githubRepo = 'sw-office'; // Replace with your actual repository name

  getLatestVersion(): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.latestVersion);
      }, 2000);
    });
  }

  getReleaseUrl(version: string): Promise<string> {
    return new Promise((resolve) => {
      const url = `https://github.com/${this.githubOwner}/${this.githubRepo}/releases/tag/v${version}`;
      resolve(url);
    });
  }
}
