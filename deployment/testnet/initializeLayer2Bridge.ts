/* eslint-disable no-await-in-loop, no-use-before-define, no-lonely-if, no-restricted-syntax */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved */

/* eslint-disable no-await-in-loop, no-use-before-define, no-lonely-if */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved */
import {expect} from "chai";
import path = require("path");
import fs = require("fs");

import * as dotenv from "dotenv";
dotenv.config({path: path.resolve(__dirname, "../.env")});
import {ethers} from "hardhat";

import yargs from "yargs/yargs";

const argv = yargs(process.argv.slice(2))
    .options({
        input: {type: "string", default: "../v2/deploy_parameters.json"},
        deployOutput: {type: "string", default: "../v2/deploy_output.json"},
    })
    .parse() as any;


const deployParameters = require(argv.input);
const deployOutput = require(argv.deployOutput);
async function main() {

    let currentProvider = 'http://106.75.8.79:8123';

    // @ts-ignore
    const deployer = new ethers.Wallet(deployParameters.deployerPvtKey, currentProvider);
    const bridgeV2Factory = await ethers.getContractFactory("PolygonZkEVMBridgeV2", deployer);
    const bridgeV2 = bridgeV2Factory.attach(deployOutput.polygonZkEVMBridgeAddress);
    let tokenName = "GreenMetaverseToken";
    let tokenSymbol = "GMT";
    let decimals = 8;
    const metadataToken = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "string", "uint8"],
        [tokenName, tokenSymbol, decimals]
    );
    let tx = await bridgeV2.connect(deployer).initialize(1, deployParameters.gasTokenAddress, 0, "0xa40d5f56745a118d0906a34e69aec8c0db1cb8fa", ethers.ZeroAddress, metadataToken)
    console.log(tx)
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});