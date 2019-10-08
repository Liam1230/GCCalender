<template>
<v-container fill-height fill-width fluid grid-list-xl>
	<v-layout justify-center wrap>
		<v-flex xs8 md8 class="align-center">
			<p>ここで既存の授業を選択</p>
		</v-flex>
		<v-flex xs4 md4>
			<v-btn>
				予約
			</v-btn>
		</v-flex>
		<v-flex xs8 md8>
			<v-menu
				ref="menu"
				v-model="menu"
				:close-on-content-click="false"
				:return-value.sync="date"
				transition="scale-transition"
				offset-y
				min-width="290px"
			>
				<template v-slot:activator="{ on }">
				<v-text-field
					v-model="date"
					label="Picker in menu"
					prepend-icon="mdi-event"
					readonly
					v-on="on"
				></v-text-field>
				</template>
				<v-date-picker v-model="date" no-title scrollable>
				<div class="flex-grow-1"></div>
				<v-btn text color="primary" @click="menu = false">Cancel</v-btn>
				<v-btn text color="primary" @click="$refs.menu.save(date)">OK</v-btn>
				</v-date-picker>
			</v-menu>
		</v-flex>
		<v-flex xs4 md4>
			<v-btn>
				授業をリクエスト
			</v-btn>
		</v-flex>
		<v-flex xs12 md12>
			<v-sheet height="64">
				<v-toolbar flat color="white">
				<v-btn outlined class="mr-4" @click="setToday">
					Today
				</v-btn>
				<v-btn fab text small @click="prev">
					<v-icon small>mdi-chevron-left</v-icon>
				</v-btn>
				<v-btn fab text small @click="next">
					<v-icon small>mdi-chevron-right</v-icon>
				</v-btn>
				<v-toolbar-title>{{ title }}</v-toolbar-title>
				<div class="flex-grow-1"></div>
				<v-menu bottom right>
					<template v-slot:activator="{ on }">
					<v-btn outlined v-on="on">
						<span>{{ typeToLabel[type] }}</span>
						<v-icon right>mdi-menu-down</v-icon>
					</v-btn>
					</template>
					<v-list>
					<v-list-item @click="type = 'day'">
						<v-list-item-title>Day</v-list-item-title>
					</v-list-item>
					<v-list-item @click="type = 'week'">
						<v-list-item-title>Week</v-list-item-title>
					</v-list-item>
					<v-list-item @click="type = 'month'">
						<v-list-item-title>Month</v-list-item-title>
					</v-list-item>
					<v-list-item @click="type = '4day'">
						<v-list-item-title>4 days</v-list-item-title>
					</v-list-item>
					</v-list>
				</v-menu>
				</v-toolbar>
			</v-sheet>
			<v-sheet height="600">
				<v-calendar ref="calendar" v-model="focus" color="primary" :events="events" :event-color="getEventColor" :event-margin-bottom="3" :now="today" :type="type"
					first-interval="11" @click:event="showEvent" @click:more="viewDay" @click:date="viewDay" locale="ja-jp"
					@change="updateRange" :day-format="timestamp => new Date(timestamp.date).getDate()">
				</v-calendar>
				<v-menu v-model="selectedOpen" :close-on-content-click="false" :activator="selectedElement" full-width offset-x>
				<v-card color="grey lighten-4" min-width="350px" flat>
					<v-toolbar :color="selectedEvent.color" dark>
					<v-btn icon>
						<v-icon>mdi-pencil</v-icon>
					</v-btn>
					<v-toolbar-title v-html="selectedEvent.name"></v-toolbar-title>
					<div class="flex-grow-1"></div>
					<v-btn icon>
						<v-icon>mdi-heart</v-icon>
					</v-btn>
					<v-btn icon>
						<v-icon>mdi-dots-vertical</v-icon>
					</v-btn>
					</v-toolbar>
					<v-card-text>
					<span v-html="selectedEvent.details"></span>
					</v-card-text>
					<v-card-actions>
					<v-btn text color="secondary" @click="selectedOpen = false">
						Cancel
					</v-btn>
					</v-card-actions>
				</v-card>
				</v-menu>
			</v-sheet>
			<v-calendar id="calender" type="week" first-interval="11" :events="events">
			</v-calendar>
		</v-flex>
		
	</v-layout>
</v-container>
</template>

<script>
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = 'token.json';

	export default {
		data: () => ({
			menu: false,
			date: new Date().toISOString().substr(0, 10),
			today: '2019-01-01',
			focus: '2019-01-01',
			type: 'month',
			typeToLabel: {
				month: 'Month',
				week: 'Week',
				day: 'Day',
				'4day': '4 Days',
			},
			start: null,
			end: null,
			selectedEvent: {},
			selectedElement: null,
			selectedOpen: false,
			events: [
				// {
				// 	name: 'Vacation',
				// 	start: '2019-10-04 13:00',
				// 	end: '2019-10-04 16:30',
				// },
			]
		}),
		mounted () {
			this.$refs.calendar.checkChange()
			const getUrl="https://us-central1-garagecampus-dd3ca.cloudfunctions.net/getCalenderEvents"
			this.$axios.get(getUrl)
			.then(res=>{
				const {data} = res
				for(const event of data){
					console.log(`${new Date(event.start.dateTime).toISOString().substr(0, 10)} ${new Date(event.start.dateTime).toLocaleTimeString()}`)
					console.log(event)
					const tmp ={
						name: event.summary,
						start:`${new Date(event.start.dateTime).toISOString().substr(0, 10)} ${new Date(event.start.dateTime).toLocaleTimeString()}`,
						end:`${new Date(event.end.dateTime).toISOString().substr(0, 10)} ${new Date(event.end.dateTime).toLocaleTimeString()}`,
						color: '#4285F4',
					}
					this.events.push(tmp)
					//console.log(date)
				}
			})
			.catch(err=>{
				alert(err)
			})
		},
		methods:{
			viewDay ({ date }) {
				this.focus = date
				this.type = 'day'
			},
			getEventColor (event) {
				return event.color
			},
			setToday () {
				this.focus = this.today
			},
			prev () {
				this.$refs.calendar.prev()
			},
			next () {
				this.$refs.calendar.next()
			},
			showEvent ({ nativeEvent, event }) {
				const open = () => {
				this.selectedEvent = event
				this.selectedElement = nativeEvent.target
				setTimeout(() => this.selectedOpen = true, 10)
				}

				if (this.selectedOpen) {
				this.selectedOpen = false
				setTimeout(open, 10)
				} else {
				open()
				}

				nativeEvent.stopPropagation()
			},
			updateRange ({ start, end }) {
				// You could load events from an outside source (like database) now that we have the start and end dates on the calendar
				this.start = start
				this.end = end
			},
			nth (d) {
				return d > 3 && d < 21
					? 'th'
					: ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'][d % 10]
			},
		},
		computed: {
			title () {
				const { start, end } = this
				if (!start || !end) {
					return ''
				}

				const startMonth = this.monthFormatter(start)
				const endMonth = this.monthFormatter(end)
				const suffixMonth = startMonth === endMonth ? '' : endMonth

				const startYear = start.year
				const endYear = end.year
				const suffixYear = startYear === endYear ? '' : endYear

				const startDay = start.day + this.nth(start.day)
				const endDay = end.day + this.nth(end.day)

				switch (this.type) {
				case 'month':
					return `${startMonth} ${startYear}`
				case 'week':
				case '4day':
					return `${startMonth} ${startDay} ${startYear} - ${suffixMonth} ${endDay} ${suffixYear}`
				case 'day':
					return `${startMonth} ${startDay} ${startYear}`
				}
				return ''
			},
			monthFormatter () {
				return this.$refs.calendar.getFormatter({
				timeZone: 'UTC', month: 'long',
				})
			},
		},

	}
</script>

<style>
	#calender{
		height: 80vh;
	}
</style>