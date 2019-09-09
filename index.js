const { exec, execSync } = require('child_process');
const downloadsFolder = require('downloads-folder');
const { download } = require('downinst');
const path = require('path');
const fs = require('fs');
const extract = require('extract-zip');

function isInstalled() {
    return new Promise((resolve, reject) => {
        exec('ffmpeg -version', (err, stdout, stderr) => {
            err ? reject() : resolve();
        });
    });
}

function isInstalledSync() {
    try {
        execSync('ffmpeg -version');
        return true;
    }
    catch {
        return false;
    }
}

function extractFFMPEG(zipFile, target, onFinish) {
    extract(zipFile, {dir: target}, (err) => {
        if (err) throw err;
        fs.readdir(target, (err, files) => {
            if (err) throw err;
            files.forEach(function (extractedFolder) { 
                if (onFinish)
                    onFinish(path.join(target, extractedFolder));
            });
        });
    });
}

function installFFMPEG(onFinish, onDownload, installPlace) { 
    const outFile = path.join(downloadsFolder(), "ffmpeg.zip");

    // delete to redownload it
    if (fs.existsSync(outFile)) {
        fs.unlink(outFile);
    }

    if (process.platform === "win32") {
        // TODO auto assign version
        download({
            type: "http",
            out: outFile,
            files: {
                "win32": {
                    "x64": "https://ffmpeg.zeranoe.com/builds/win64/static/ffmpeg-20190826-0821bc4-win64-static.zip",
                    "x86": "https://ffmpeg.zeranoe.com/builds/win32/static/ffmpeg-20190826-0821bc4-win32-static.zip"
                }
            }
        }, {
            onFinish: (file) => {
                const target = path.join(downloadsFolder(), 'ffmpeg');
                extractFFMPEG(file, target, (extracted) => {
                    if (fs.existsSync(installPlace)) {
                        deleteFolderRecursive(installPlace);
                    }
                    fs.rename(extracted, installPlace, (err) => {
                        if (err) throw err;
                        if (onFinish)
                            onFinish();
                    });
                });
            },
            onProgress: onDownload
        });
    } else {
        throw new Error("Not implemented yet");
        // TODO FOR DARWIN AND LINUX
    }
    
    
}

function update() {
    // TODO
}

function deleteFolderRecursive(path) {
    if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function(file,index){
        var curPath = path + "/" + file;
        if(fs.lstatSync(curPath).isDirectory()) { // recurse
            deleteFolderRecursive(curPath);
        } else { // delete file
            fs.unlinkSync(curPath);
        }
        });
        fs.rmdirSync(path);
    }
}

module.exports = {
    isInstalled: isInstalled,
    isInstalledSync: isInstalledSync,
    install: installFFMPEG,
    extract: extractFFMPEG
};