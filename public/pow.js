async function minePow(e, target) {
    let ctr = 0;

    let nonceTagIdx = e.tags.findIndex(a => a[0] === "nonce");
    if (nonceTagIdx === -1) {
        nonceTagIdx = e.tags.length;
        e.tags.push(["nonce", ctr.toString(), target.toString()]);
    }
    do {
        //roll ctr and compute id
        const now = Math.floor(Date.now() / 1000);
        // reset ctr if timestamp changed, this is not really needed but makes the ctr value smaller
        if (now !== e.created_at) {
            ctr = 0;
            e.created_at = now;
        }
        e.tags[nonceTagIdx][1] = (++ctr).toString();

        e.id = await createId(e);
    } while (countLeadingZeros(e.id) < target);

    return e;
}

async function createId(e) {
    const payload = [0, e.pubkey, e.created_at, e.kind, e.tags, e.content];
    const hex = await sha256(JSON.stringify(payload))
    return hex
}

function countLeadingZeros(hex) {
    let count = 0;

    for (let i = 0; i < hex.length; i++) {
        const nibble = parseInt(hex[i], 16);
        if (nibble === 0) {
            count += 4;
        } else {
            count += Math.clz32(nibble) - 28;
            break;
        }
    }

    return count;
}


async function sha256(message) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string                  
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}



onmessage = async (e) => {
    try {
        const { id, event, target } = e.data || {}
        console.log('minePow:1', { event, target })
        const powEvent = await minePow(event, target)
        console.log("minePow:powEvent", powEvent);
        postMessage({ id, event: powEvent });
    } catch (err) {
        console.error(err)
        postMessage({ id, error: err })
    }
};
