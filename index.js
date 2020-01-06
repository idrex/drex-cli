#!/usr/bin/env node

// 处理用户输入的命令
const program = require('commander');

const path = require('path')
// 问题交互
const inquirer = require('inquirer');
// node 文件模块
const fs = require('fs');
// 填充信息至文件
const handlebars = require('handlebars');
// 动画效果
const ora = require('ora');
// 字体加颜色
const chalk = require('chalk');
// 显示提示图标
const symbols = require('log-symbols');
// 命令行操作
var shell = require("shelljs");

/**
 * 删除文件夹
 * @param {*} path 
 */
function deleteFolder(path) {
  var files = [];
  if( fs.existsSync(path) ) {
      files = fs.readdirSync(path);
      files.forEach(function(file,index){
          var curPath = path + "/" + file;
          if(fs.statSync(curPath).isDirectory()) {
              deleteFolder(curPath);
          } else {
              fs.unlinkSync(curPath);
          }
      });
      fs.rmdirSync(path);
  }
}

/**
 * 创建项目
 * @param {*} name 
 * @param {*} answers 
 */
function createProject(name,answers){
  const meta = {
    name,
    nameKey:'name',
    description: answers.description,
    author: answers.author,
    systemName: answers.systemName,
    // ci: answers.ci,
    type: answers.type,
  }
  // 生成CI yml
  // const ciFile = `${name}/ci`;
  // if(meta.ci){
  //   fs.rename(ciFile, `${name}/.gitlab-ci.yml`, (err) => {
  //     if(err) console.log(err)
  //   });
  // } else {
  //   if(fs.existsSync(ciFile)){
  //     fs.unlink(ciFile, (err) => {
  //       if (err) console.log(err);
  //     });
  //   }
  // }

  // 删除无用文件
  const gitFile = `${name}/.git`;
  deleteFolder(gitFile)

  // 修改文件
  // const packageJson = `${name}/package.json`;
  // const manifestJson = `${name}/src/manifest.json`;
  // const defaultSettings = `${name}/config/defaultSettings.ts`;
  const readmeMd = `${name}/README.md`
  // const indexPages = `${name}/src/pages/document.ejs`
  // const configFile = `${name}/config/config${meta.type === 'v4.x'?'.ts':'.js'}`;

  // modifyFile(packageJson,meta)
  // if(meta.type === 'v4.x'){
  //   modifyFile(manifestJson,meta)
  //   modifyFile(defaultSettings,meta)
  // }
  modifyFile(readmeMd, meta)
  // modifyFile(indexPages,meta)
  // modifyFile(configFile,meta)

  // 修改文件名 
  // fs.rename(configFile, `${name}/config/config${meta.type === 'v4.x'?'.ts':'.js'}`, (err) => {
  //   if(err) console.log(err)
  // });

  console.log(symbols.success, chalk.green('项目创建成功!'));
}

/**
 * 修改文件
 * @param {*} file 
 * @param {*} data 
 */
function modifyFile(file,data){
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file).toString();
    const result = handlebars.compile(content)(data);
    fs.writeFileSync(file, result);
  }
}

/**
 * 安装依赖
 * @param {*} name 
 */
function installPackage(name){
  inquirer.prompt([
    {
      type: 'confirm',
      name: 'ifInstall',
      message: '是否自动安装依赖?',
      default: true
    }
  ]).then((answers) => {
    if (answers.ifInstall) {
      inquirer.prompt([
        {
          type: 'list',
          name: 'installWay',
          message: '请选择安装方式',
          choices: [
            'npm', 'cnpm', 'yarn'
          ]
        }
      ]).then((answers) => {
        let installWayName = 'npm'
        let installWayCommand =`cd ${name} && npm i`;
        if (answers.installWay === 'yarn') {
          installWayName = 'yarn'
          installWayCommand =`cd ${name} && yarn`;
        } else if(answers.installWay === 'cnpm') {
          installWayName = 'cnpm'
          installWayCommand =`cd ${name} && cnpm i`;
        }
        let spinner = ora(`${installWayName}安装中...`);
        spinner.start();
        // 命令行操作安装依赖
        shell.exec(installWayCommand, function (err, stdout, stderr) {
          if (err) {
            spinner.fail();
            console.log(symbols.error, chalk.red(err));
          }
          else {
            spinner.succeed();
            console.log(symbols.success, chalk.green('依赖安装成功!'));
          }
        });
      })
    } else {
      console.log(symbols.success, chalk.green('请进入项目文件自己安装依赖!'));
    }
  })
}


/**
 * 初始化
 */
program.version(require('./package').version, '-v, --version')
  .command('init <name>')
  .action((name) => {
    if (!fs.existsSync(name)) {
      // 对话
      inquirer.prompt([
        {
          type: 'input',
          name: 'systemName',
          message: '请输入所建系统中文名称（必填）：',
          validate: (value)=>{
            if(value){
              return true
            }else{
              return '此项为必填项'
            }
          }
        },
        {
          type: 'list',
          name: 'type',
          message: '请选择项目类型',
          choices: [
            'MicroFrontends',// 微前端
            'AntDesignPro',// AntDesignPro框架
            'Egg',// Egg.js服务
            'ServerLess',// 无服务框架
            'UniApp'// 小程序多端框架
          ]
        },
        {
          type: 'input',
          name: 'description',
          message: '请输入描述（选填）：'
        },
        {
          type: 'input',
          name: 'author',
          message: '请输入作者名称（选填）：'
        },
        // {
        //   type: 'confirm',
        //   name: 'ci',
        //   message: '是否自动生成.gitlab-ci.yml文件?',
        //   default: true
        // },
      ]).then((answers) => {
        let address;
        switch(answers.type) {
          case 'Ant Design Pro':
            address = 'https://github.com/idrex/drex-antd-pro.git';
            break;
          default: 
            address = 'https://github.com/idrex/drex-antd-pro.git';
        }
        // let address = 'ssh://git@git.taoche.com:52000/npm/antd-pro-template.git'
        // if(answers.type === "v4.x"){
        //   address = 'ssh://git@git.taoche.com:52000/npm/antd-pro-template-v4.git'
        // }
        const spinner = ora('创建中...');
        spinner.start();
        // 下载仓库
        // 命令行操作安装依赖
        shell.exec(`git clone ${address} ${path.join(process.cwd(), name)}`, function (err, stdout, stderr) {
          if (err) {
            spinner.fail();
            console.log(symbols.error, chalk.red(err));
          } else {
            // 下载成功调用
            spinner.succeed();
            
            // 创建项目 
            createProject(name,answers);
            
            // 安装依赖
            installPackage(name);
          }
        });
      })
    } else {
      // 错误提示项目已存在，避免覆盖原有项目
      console.log(symbols.error, chalk.red('项目已存在'));
    }
  });

program.parse(process.argv);