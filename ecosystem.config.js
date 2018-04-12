module.exports = {

  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */

  apps: [
    {
      name: 'littlelyon.com',
      script: 'public/index.html'
    }
  ],
  deploy: {
    "prod": {
      "key": "~/.ssh/id_rsa",
      "user": "ubuntu",
      "host": "58.87.91.173",
      "ref": "origin/master",
      "repo": "git@github.com:haoliangwu/littlelyon.git",
      "path": "/home/ubuntu/littlelyon",
      "ssh_options": ["StrictHostKeyChecking=no", "PasswordAuthentication=no"],
      "post-deploy": "yarn install && yarn build",
    }
  }
};
