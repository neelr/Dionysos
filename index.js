const Airtable = require("airtable")
const { App, ExpressReceiver } = require('@slack/bolt');

var base = new Airtable({apiKey: process.env.KEY}).base(process.env.BASE);

const receiver = new ExpressReceiver({ signingSecret: process.env.SIGN });

const app = new App({
	token: process.env.TOKEN,
	signingSecret: process.env.SIGN,
	receiver
});

app.event('message', async ({ event, context }) => {
	if (!event.subtype && event.channel == "C0266FRGT" && !event.thread_ts) {
		const result = await app.client.chat.getPermalink({
			token: context.botToken,
			channel: event.channel,
			message_ts:event.ts
		});
		let people = await base("People").select({
			view:"Grid view"
		}).all()
		people.map(async userRecord => {
			await app.client.chat.postMessage({
				token: context.botToken,
				channel: userRecord.fields.ID,
				text: `:tada: New Announcement - ${result.permalink}!`
			});
		})
	}
});

app.command('/announcement-subscribe', async ({ command, ack, say }) => {
  // Acknowledge command request
  let person = await base("People").select({
	  view:"Grid view",
	  filterByFormula:`{ID}='${command.user_id}'`
  }).all()

  if (person.length == 0) {
	  await base("People").create({
		ID:command.user_id
	  })
	  await ack({
			response_type: "ephemeral",
			text: "Added you to announcements!"
		})
	  return
  }
  console.log(person)
  await base("People").destroy(person[0].id)
  await ack({
			response_type: "ephemeral",
			text: "Deleted you from announcements!"
		})
});

receiver.router.get('/', (req, res) => {
  res.send("Awake")
});

(async () => {
	// Start your app
	await app.start(process.env.PORT || 3000);

	console.log('⚡️ Bolt app is running!');
})();

