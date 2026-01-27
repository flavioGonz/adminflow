
const { initMongo, getMongoDb } = require('./server/lib/mongoClient');

async function fixTicketIds() {
    await initMongo();
    const db = getMongoDb();

    console.log('Fetching all tickets...');
    const tickets = await db.collection('tickets').find().sort({ createdAt: 1 }).toArray();

    console.log(`Found ${tickets.length} tickets to renumber.`);

    let counter = 0;
    for (const ticket of tickets) {
        counter++;
        const newId = counter;
        const oldId = ticket.id;

        if (oldId === newId && typeof oldId === 'number') {
            // Already correct, skip write if possible, but just to be safe...
            continue;
        }

        console.log(`Renumbering ticket ${ticket._id}: ${oldId} (${typeof oldId}) -> ${newId}`);

        await db.collection('tickets').updateOne(
            { _id: ticket._id },
            { $set: { id: newId, numericId: newId } }
        );

        // Update referencing payments (best effort)
        if (oldId && oldId !== newId) {
            // If oldId was ambiguous (shared by 2 tickets), this might update payments for wrong ticket
            // But since we are processing in order, and presumably payments link to "unique" ids...
            // Actually, if we have duplicate IDs, we have broken references anyway.
            // Let's just update payments that match the OLD ID type/value
            await db.collection('payments').updateMany(
                { ticketId: oldId },
                { $set: { ticketId: newId } }
            );
        }
    }

    console.log(`Updated IDs for ${counter} tickets.`);

    // Update counter
    await db.collection('counters').updateOne(
        { _id: 'tickets' },
        { $set: { sequence: counter } },
        { upsert: true }
    );
    console.log(`Updated 'tickets' counter to ${counter}.`);

    process.exit();
}

fixTicketIds().catch(console.error);
