const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('[COIN FLIPPER EXPLOIT]', async function () {
    let deployer, attacker

    const INITIAL_BALANCE = ethers.utils.parseEther('10')

    before(async function () {
        // SET UP
        ;[deployer, attacker] = await ethers.getSigners()

        this.rng = await (await ethers.getContractFactory('RandomNumber', deployer)).deploy()
        this.coinFlipper = await (await ethers.getContractFactory('CoinFlipper', deployer)).deploy(
            this.rng.address,
            { value: INITIAL_BALANCE }
        )

        expect(
            await ethers.provider.getBalance(this.coinFlipper.address)
        ).to.equal(INITIAL_BALANCE)
    })

    it('Exploit', async function () {
        // YOUR EXPLOIT HERE

        let exploit = await (await ethers.getContractFactory('CoinFlipperExploit', deployer)).deploy(this.coinFlipper.address)

        await exploit.connect(attacker).run({
            value: ethers.utils.parseEther('1')
        });

    })

    after(async function () {
        // SUCCESS CONDITIONS
        expect(await ethers.provider.getBalance(this.coinFlipper.address)).to.be.equal('0')
    })
})
