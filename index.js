#!/usr/bin/env node

const program = require('commander')
const chalk = require('chalk')
const copydir = require('copy-dir')
const fs = require('fs-extra')
const path = require('path');
const execSync = require('child_process').execSync;
const os = require('os');

const packageJson = require('./package.json')

program.version(packageJson.version)
    .arguments('<dir>')
    .option('--no-storybook', 'build without Storybook')
    .action((dir) => {
        createReactLib(dir)
    })

program.parse(process.argv)

/** Variaveis compartilhadas */
var root;
var libName;

function gitInit() {
    console.log('Git Initialization');
    execSync('git init', { cwd: root })    

    const gitIgnore = [
        'node_modules',
        'target',
        '.cache',
        'stories/_docs'
    ].join(os.EOL)

    fs.writeFileSync(
        path.join(root, '.gitignore'),
        gitIgnore + os.EOL
    )
}

function configYarnDeps() {
    console.log('Config Yarn and Dependencies');
    const peer = [ 
        'react', 
        'react-dom' 
    ]
    const dev = [ 
        'react', 
        'react-dom', 
        '@babel/polyfill', 
        '@babel/core',
        '@babel/cli',
        '@babel/preset-env',
        '@babel/preset-react',
        '@babel/plugin-proposal-decorators',
        '@babel/plugin-proposal-class-properties',
        'mkdirp',
        'glob',
        'react-docgen',
        'rimraf',
        'fs-extra',
        'highlight.js',
        'marked'
    ]
    const deps = [ 
        'prop-types', 
        'react-jss', 
        'color'
    ]
    
    const libPackageJson = {
        name: `@touchhealth/${libName}`,
        version: '0.1.0',
        license: "UNLICENSED",
        private: true,
        scripts: {            
            "clean": "rimraf target",
            "cleanall": "rimraf target && rimraf node_modules",
            "build": "yarn build:babel && yarn build:prepareTarget",
            "build:babel": "babel src -d target -s --copy-files",
            "build:prepareTarget": "node ./scripts/prepareTarget.js",
            "dev": "babel src -d target -s -w --copy-files"
        }
    }

    fs.writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify(libPackageJson, null, 2) + os.EOL
    )
    
    execSync('yarn add -P ' + peer.join(' '), { cwd: root })
    execSync('yarn add -D ' + dev.join(' '), { cwd: root })
    execSync('yarn add ' + deps.join(' '), { cwd: root })

    fs.ensureDirSync(path.join(root, 'src'))   
    fs.ensureDirSync(path.join(root, 'scripts')) 
    fs.ensureDirSync(path.join(root, 'target'))
    copydir.sync(path.join(__dirname, 'doc'), root)
    copydir.sync(path.join(__dirname, 'scripts'), path.join(root, 'scripts'))
}

function configBabel() {
    console.log('Config Babel');
    const babelrc = {
        "presets": [
            "@babel/preset-env",
            "@babel/preset-react"
        ],
        "plugins": [
            ["@babel/plugin-proposal-decorators", { "legacy": true }],
            ["@babel/plugin-proposal-class-properties", { "loose" : true }]
        ]
    }

    fs.writeFileSync(
        path.join(root, '.babelrc'),
        JSON.stringify(babelrc, null, 2) + os.EOL
    )
}

function configStorybook() {
    console.log('Config Storybook')
    execSync('npx -p @storybook/cli sb init', { cwd: root })

    const packageJsonStorybook = require(path.join(root, 'package.json'))
    
    packageJsonStorybook.scripts["build:docs"] = "node ./scripts/docgen.js"
    packageJsonStorybook.scripts["storybook"] = "yarn run build:docs && " + packageJsonStorybook.scripts["storybook"]
    packageJsonStorybook.scripts["build-storybook"] = "yarn run build:docs && " + packageJsonStorybook.scripts["build-storybook"]

    fs.writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify(packageJsonStorybook, null, 2) + os.EOL
    )
}

function createReactLib(name) {
    console.log('Criando Biblioteca: ' + chalk.blueBright(name))
    fs.ensureDirSync(name)

    root = path.resolve(name)
    libName = path.basename(root)

    gitInit()
    configYarnDeps()
    configBabel()
    if (program.storybook) {
        configStorybook()
    }
}