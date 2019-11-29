<template>
<v-container fill-height fill-width fluid grid-list-xl>
	<v-dialog v-model="isLoading" fullscreen full-width>
		<v-container fluid fill-height style="background-color: rgba(255, 255, 255, 0.5);">
			<v-layout justify-center align-center>
				<v-progress-circular indeterminate color="blue"></v-progress-circular>
			</v-layout>
		</v-container>
	</v-dialog>
	<v-snackbar v-model="infoSnackbar.isShow" :color="infoSnackbar.color"
		:timeout="infoSnackbar.timeout" :top="infoSnackbar.top" 
		:vertical="infoSnackbar.vertical">
		{{ infoSnackbar.text }}
		<v-btn dark text @click="infoSnackbar.isShow = false">
			Close
		</v-btn>
	</v-snackbar>
	<v-layout justify-center wrap>
		<v-flex xs12>
			<v-toolbar dark prominent src="https://cdn.vuetifyjs.com/images/backgrounds/vbanner.jpg">
      		<v-toolbar-title>GarageCampus予約システム</v-toolbar-title>
      		<div class="flex-grow-1"></div>
			</v-toolbar>				
		</v-flex>
		<v-flex xs12 md12>
			<v-form>
				<v-row align="center">
					<v-col cols="12" md="4">
						<v-menu
							ref="menu"
							v-model="menu"
							:close-on-content-click="false"
							:return-value.sync="date"
							transition="scale-transition"
						>
							<template v-slot:activator="{ on }">
								<v-text-field
									v-model="date"
									label="日付を選択"
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
					</v-col>
					<v-col cols="12" md="4">
						<v-select :items="times" label="時間を選択" v-model="selectTime">
						</v-select>
					</v-col>
					<v-col cols="12" md="4">
						<v-btn v-on:click="onClickRequest" color="blue" class="white--text font-weight-bold">
							授業をリクエスト
						</v-btn>
					</v-col>
				</v-row>
			</v-form>
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
					first-interval="11" @click:event="showEvent" locale="ja-jp"
					@change="updateRange" :day-format="timestamp => new Date(timestamp.date).getDate()">
				</v-calendar>
				<v-menu v-model="selectedOpen" :close-on-content-click="false" :activator="selectedElement" full-width offset-x>
				<v-card color="grey lighten-4" min-width="350px" flat>
					<v-toolbar :color="selectedEvent.color" dark>
						<v-toolbar-title v-html="selectedEvent.name"></v-toolbar-title>
						<div class="flex-grow-1"></div>
					</v-toolbar>
					<v-card-text>
						<p>開始: {{selectedEvent.start | eventTimeFilter}}</p>
						<p>終了: {{selectedEvent.end | eventTimeFilter}}</p>
						<p>会場: {{selectedEvent.location}}</p>
						<p>参加者: {{selectedEvent.attendees | eventAttendeesFilter}}</p>
						<span v-html="selectedEvent.details"></span>
					</v-card-text>
					<v-card-actions>
						<v-btn outlined color="blue" @click="joinEvent(selectedEvent)">
							参加する
						</v-btn>
						<v-btn outlined color="secondary" @click="selectedOpen = false">
							Cancel
						</v-btn>
					</v-card-actions>
				</v-card>
				</v-menu>
			</v-sheet>
		</v-flex>
		<v-flex xs12>
			<v-btn v-if="isLogin" v-on:click="doLogout" color="blue" class="white--text font-weight-bold">
				ログアウト
			</v-btn>
		</v-flex>			
	</v-layout>
</v-container>
</template>

<script>
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = 'token.json';

	export default {
		data: () => ({
			user:null,
			menu: false,
			date: new Date().toISOString().substr(0, 10),
			today: new Date().toISOString().substr(0, 10),
			focus: new Date().toISOString().substr(0, 10),
			type: 'month',
			infoSnackbar: {
				isShow:false,
				text:"",
				timeout:2000,
				color:"info",
				top:true,
				vertical:true,
			},
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
			selectTime:'',
			loadingCount: 1,
			isLogin:false,
			events: [],
			times: [
				'13:00〜16:00',
				'16:00〜19:00',
				'19:00〜21:30'
			]
		}),
		mounted () {
			var auth = this.$firebase.auth();
			var provider = new this.$firebase.auth.GoogleAuthProvider();

			auth.onAuthStateChanged(user=>{
				if(user==null){
					this.$firebase.auth().signInWithRedirect(provider);
				}else{
					//console.log(user)
					if(!this.isLogin){
						this.loadingCount--;
						this.showInfoSnackBar("ログイン成功:" + user.email)
					}
					this.isLogin = true;
					this.user=user;
				}
			})
			//this.$refs.calendar.checkChange()
			const getUrl="https://us-central1-garagecampus-dd3ca.cloudfunctions.net/getCalenderEvents"
			this.$axios.get(getUrl)
			.then(res=>{
				const {data} = res
				for(const event of data){
					//console.log(`${new Date(event.start.dateTime).toISOString().substr(0, 10)} ${new Date(event.start.dateTime).toLocaleTimeString()}`)
					//console.log(event)
					const tmp ={
						id: event.id,
						attendees: event.attendees,
						name: event.summary,
						location: event.location, 
						start:`${new Date(event.start.dateTime).toISOString().substr(0, 10)} ${new Date(event.start.dateTime).toLocaleTimeString()}`,
						end:`${new Date(event.end.dateTime).toISOString().substr(0, 10)} ${new Date(event.end.dateTime).toLocaleTimeString()}`,
						color: '#4285F4',
						originalEvent: event
					}
					this.events.push(tmp)
				}
			})
			.catch(err=>{
				alert(err)
			})
		},
		filters:{
			eventTimeFilter: value=>{
				if(!value)return ""
				return value.substr(11,5)
			},
			eventAttendeesFilter: value=>{
				if(!value)return ""
				let tmp = ""
				value.map(val=>{
					if(val.email){
						tmp += `${val.email}, `
					}
				})
				return tmp
			}
		},
		methods:{
			showErrorSnackBar: function(text){
				this.infoSnackbar.color = "error";
				this.infoSnackbar.text = text;
				this.infoSnackbar.isShow = true;
			},
			showInfoSnackBar: function(text){
				this.infoSnackbar.color = "info";
				this.infoSnackbar.text = text;
				this.infoSnackbar.isShow = true;
			},
			doLogout(){
				var auth = this.$firebase.auth();
				auth.signOut().then(res=>{
					this.isLogin = false;
				});
			},
			onClickRequest(){
				if(!this.selectTime){
					this.showErrorSnackBar("時間を選択してください")
					return;
				}
				this.loadingCount++;
				//ここで日時とリクエストした人をパラメータに入れてメールを送るAPIを呼び出す
				const url = 'https://us-central1-garagecampus-dd3ca.cloudfunctions.net/onRequestClass'
				this.$axios.post(url, {
					date: this.date,
					time: this.selectTime,
					auther: this.user.email
				}).then(res=>{
					this.loadingCount--;
					console.log(res)
					this.showInfoSnackBar("授業のリクエストが完了しました。返答をお待ちください。")
				}).catch(err=>{
					this.loadingCount--;
					this.showErrorSnackBar(err)
					console.log(err)
				})
			},
			joinEvent (event) {
				this.loadingCount++;
				//cloud function addatenders
				const url = "https://us-central1-garagecampus-dd3ca.cloudfunctions.net/addEventAttendees"
				this.$axios.post(url, {
					event: event.originalEvent,
					attendees: this.user.email
				}).then(res=>{
					this.loadingCount--;
					console.log(res)
					this.showInfoSnackBar("授業に参加登録しました。")
				}).catch(err=>{
					this.loadingCount--;
					console.log(err)
					this.showErrorSnackBar("エラー発生:" + err)
				})
			},
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
			isLoading (){
				if(this.loadingCount <= 0)return false;
				return true;
			},
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
	.logo{
		max-height:100%;
		height: 100%;
	}
</style>