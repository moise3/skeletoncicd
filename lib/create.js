const execSync = require('child_process').execSync
const inquirer = require('inquirer')
const fs = require('fs')
// const path = require('path')
const chalk = require("chalk");
// const figlet = require("figlet");
const shell = require("shelljs");
const { domaines, evnironnements, versions } = require('./values')
// const changeCase = require('change-case')


// const init = () => {
//     console.log(
//         chalk.green(
//             figlet.textSync("Node f*cking JS", {
//                 // font: "Ghost",
//                 font: "avatar",
//                 horizontalLayout: "default",
//                 verticalLayout: "default"
//             })
//         )
//     );
// }

const askQuestions = () => {
    const questions = [
        {
            name: 'DOM',
            type: 'list',
            message: 'Selectionnez le domaine : ',
            choices: domaines
        },
        {
            name: 'APP',
            type: 'input',
            message: 'Entrez nom de l\'application ***minuscules sans trait d\'union, caractères spéciaux, soulignés, chiffres, etc.*** : '
        },
        {
            name: 'ENV',
            type: 'list',
            message: 'Selectionnez l\'environnement : ',
            choices: evnironnements
        },
        {
            name: 'VER',
            type: 'list',
            message: 'Selectionnez la version : ',
            choices: versions
        }
    ];

    return inquirer.prompt(questions);

}

const createDirArbo = (dom, app) => {
    const dirPathBuild  = `${process.cwd()}/tests/${dom}-${app}/build`
    // const dirPathDeploy = `${process.cwd()}/tests/${dom}-${app}/deploy`
    const dirPathPipeline = `${process.cwd()}/tests/${dom}-${app}/pipeline`
    const dirPathSrc = `${process.cwd()}/tests/${dom}-${app}/src`
    shell.mkdir('-p', dirPathBuild)
    // shell.mkdir('-p', dirPathDeploy)
    shell.mkdir('-p', dirPathPipeline)
    shell.mkdir('-p', dirPathSrc)
    arrayDirs = Array()
    arrayDirs["build"] = `tests/${dom}-${app}/build`
    // arrayDirs["deploy"] = `tests/${dom}-${app}/deploy`
    arrayDirs["pipeline"] = `tests/${dom}-${app}/pipeline`
    arrayDirs["src"] = `tests/${dom}-${app}/src`
    return arrayDirs;
};

const createFiles = (path, filename, content) => {
    const filePath = `${process.cwd()}/${path}/${filename}`
    shell.touch(filePath);
    fs.writeFile(filePath, content, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log(`${filePath} créé avec succès`);
    });
    return filePath;
}

const success = msg => {
    console.log(
      chalk.white.bgGreen.bold(`${msg}`)
    );
  };

const run = async () => {
    // show script introduction
    //init();

    // ask questions
    const answers = await askQuestions();
    const { DOM, APP, ENV, VER } = answers;

    // create directories
    var arrayDirs = createDirArbo(DOM, APP);
    // create files
    const filepathDockerfile = createFiles(arrayDirs["build"], "Dockerfile", "# Everything on this line is a comment")

    let jenkinsparams = `env.credentials='<credentials>'\n` +
                        `env.passwordlistid='<passwordlistid>'\n` +
                        `env.passwordtitle='<passwordtitle>'\n` +
                        `env.passwordfield='<passwordfield>'\n` +
                        `env.registry='uqam/${DOM}-${APP}'\n` +
                        `env.dockername='${DOM}-${APP}'\n` +

                        `if (env.BRANCH_NAME == 'dev'){\n` + 
                            `\tenv.tag='latest'\n` +
                            `\tenv.namespace='${DOM}-${APP}-dev-${VER}'\n` +
                            `\tenv.helmname='${DOM}-${APP}-${ENV}'\n` +
                            `\tenv.kubeconfig='<kubeconfig>'\n` + 
                        `} else if (env.BRANCH_NAME == 'preprod') {\n` +
                            `\tenv.tag='preprod'\n` +
                            `\tenv.namespace='${DOM}-${APP}-preprod-${VER}'\n` +
                            `\tenv.helmname='${DOM}-${APP}-preprod'\n` +
                            `\tenv.kubeconfig='<kubeconfig>'\n` +
                        `} else if (env.BRANCH_NAME == 'prod') {\n` +
                            `\tenv.tag='prod'\n` +
                            `\tenv.namespace='${DOM}-${APP}-prod-${VER}'\n` +
                            `\tenv.helmname='${DOM}-${APP}-prod'\n` +
                            `\tenv.kubeconfig='<kubeconfig>'\n` +
                        `} else {\n` +
                            `\tenv.tag='latest'\n` +
                            `\tenv.namespace='${DOM}-${APP}-dev-${VER}'\n` +
                            `\tenv.helmname='${DOM}-${APP}-dev'\n` +
                            `\tenv.kubeconfig='<kubeconfig>'\n` +
                        `}`

    const filepathjenkinsparam = createFiles(arrayDirs["pipeline"], "Jenkins.params", jenkinsparams)

    fs.copyFile(`${process.cwd()}/templates/Jenkinsfile.template`, `${arrayDirs["pipeline"]}/Jenkinsfile`, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log(`${arrayDirs["pipeline"]}/Jenkinsfile créé avec succès`);
    });
    shell.cd(`${process.cwd()}/tests/${DOM}-${APP}`)
    execSync(`helm create ${DOM}-${APP}`);
    shell.mv(`${DOM}-${APP}`, `deploy`)

    // show success message
    success(`Modèle ${DOM}-${APP} générée avec succès !!`);

}

const create = function () {
    run();
}

module.exports = create