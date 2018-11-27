#!/usr/bin/env node

const program = require('commander')
const chalk = require('chalk')
const fs = require('fs-extra')
const path = require('path');
const execSync = require('child_process').execSync;
const os = require('os');

const packageJson = require('./package.json')

program.version(packageJson.version)
    .arguments('<dir>')    
    .action((dir) => {
        createReactLib(dir)
    })

program.parse(process.argv)

function createReactLib(name) {
    console.log('Criando Biblioteca: ' + chalk.blueBright(name))
    fs.ensureDirSync(name)

    const root = path.resolve(name);
    const libName = path.basename(root);

    console.log('git init');
    execSync('git init', { cwd: root })    

    console.log('.gitignore');
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

    console.log('package.json');
    const libPackageJson = {
        name: `@touchhealth/${libName}`,
        version: '0.1.0',
        license: "UNLICENSED",
        private: true,
        scripts: {
            build: "babel src -d target -s --copy-files",
            dev: "babel src -d target -s -w --copy-files"
        }
    }

    fs.writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify(libPackageJson, null, 2) + os.EOL
    )
    
    console.log('Dependencias básicas Babel e React');    
    execSync('yarn add -P react react-dom', { cwd: root })
    execSync('yarn add -D react react-dom @babel/polyfill @babel/core @babel/cli @babel/preset-env @babel/preset-react @babel/plugin-proposal-decorators @babel/plugin-proposal-class-properties', { cwd: root })
    execSync('yarn add prop-types', { cwd: root })

    console.log('.babelrc');
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

    console.log('Criando diretorios')
    fs.ensureDirSync(path.join(root, 'src'))
    fs.ensureDirSync(path.join(root, 'scripts'))
    fs.ensureDirSync(path.join(root, 'target'))

    console.log('Preparando storybook')
    execSync('npx -p @storybook/cli sb init', { cwd: root })
    
}