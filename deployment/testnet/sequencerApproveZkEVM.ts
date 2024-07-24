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
        createRollupOutput: {type: "string", default: "../v2/create_rollup_output.json"}
    })
    .parse() as any;

const deployParameters = require(argv.input);

const createRollupOutput = require(argv.createRollupOutput);
async function main() {
    let currentProvider = ethers.provider;
    if (deployParameters.multiplierGas || deployParameters.maxFeePerGas) {
        if (process.env.HARDHAT_NETWORK !== "hardhat") {
            currentProvider = ethers.getDefaultProvider(
                `https://${process.env.HARDHAT_NETWORK}.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
            ) as any;
            if (deployParameters.maxPriorityFeePerGas && deployParameters.maxFeePerGas) {
                console.log(
                    `Hardcoded gas used: MaxPriority${deployParameters.maxPriorityFeePerGas} gwei, MaxFee${deployParameters.maxFeePerGas} gwei`
                );
                const FEE_DATA = new ethers.FeeData(
                    null,
                    ethers.parseUnits(deployParameters.maxFeePerGas, "gwei"),
                    ethers.parseUnits(deployParameters.maxPriorityFeePerGas, "gwei")
                );

                currentProvider.getFeeData = async () => FEE_DATA;
            } else {
                console.log("Multiplier gas used: ", deployParameters.multiplierGas);
                async function overrideFeeData() {
                    const feedata = await ethers.provider.getFeeData();
                    return new ethers.FeeData(
                        null,
                        ((feedata.maxFeePerGas as bigint) * BigInt(deployParameters.multiplierGas)) / 1000n,
                        ((feedata.maxPriorityFeePerGas as bigint) * BigInt(deployParameters.multiplierGas)) / 1000n
                    );
                }
                currentProvider.getFeeData = overrideFeeData;
            }
        }
    }


    const sequencer = new ethers.Wallet(`${process.env.SEQUENER_PRIV_KEY}`, currentProvider);
    const polTokenFactory = await ethers.getContractFactory('ERC20PermitMock', sequencer);
    const polTokenContract = polTokenFactory.attach(deployParameters.polTokenAddress);
    const approveValue = ethers.parseEther('100000');
    const tx = await (await polTokenContract.approve(createRollupOutput.rollupAddress, approveValue)).wait();
    console.log(tx)
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
