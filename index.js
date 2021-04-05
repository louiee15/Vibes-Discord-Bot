require('dotenv').config();

const { debug } = require('console');
const { MessageEmbed } = require("discord.js");
const Discord = require('discord.js');

const bot = new Discord.Client();

bot.once('ready', () =>{
    console.log("bot is alive");
})

const prefix = '-';

const fs = require('fs');


const express = require('express');
var app     = express();

const wakeUpDyno = require("wokeDyno.js");


const PORT = process.env.PORT;
const DYNO_URL = "https://vibesdiscord-bot.herokuapp.com/";

app.listen(PORT, () => {
    wakeUpDyno(DYNO_URL); // will start once server starts
})

app.set('port', (process.env.PORT || 5000));

//For avoidong Heroku $PORT error
app.get('/', function(request, response) {
    var result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});


var responses = [];
var editComp = false;

bot.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot){
        return;
    }
    
    const args = message.content.slice(prefix.length).split(/ +/);
    
    const command = args.shift().toLowerCase();

    const questions = ['What do you want the name of the competition to be?',
    'What do you want the description of the competition to be?',
    'What is the maximum number of players for this competition?',
    'What are the rewards for this competition?',
    'What are the tracks for this competition?']

    const questionMeta = ['Are you sure you want to name the competition: ',
    'Are you sure you want the description of the competition to be: ',
    'Are you sure you want the maximum number of players for this competition to be: ',
    'Are you sure you want the rewards for this competition to be: ',
    'Are you sure you want the tracks for this compeition to be: ']

    function startCompQuestions(){

        questionNumber = responses.length;
    
        filter = (message) => !message.author.bot
        options = {
            max: 1,
            time: 60000
        }
    
        collector = message.channel.createMessageCollector(filter, options)

        collector.on('end', (collected, reason) =>{
            if (reason == 'time'){
                message.reply("You ran out of time.")
            }
            else{
                message.reply(`${questionMeta[questionNumber]} "${collected.array()[0].content}"?`)
                .then((question) =>{
                    function confirmQuestions(){
                        question.react('👍')
                        question.react('👎')
        
                        filter = (reaction, user) => {
                            return ['👍','👎'].includes(reaction.emoji.name) && !user.bot;
                        }
        
                        options = {
                            max: 1,
                            time: 60000
                        }
    
        
                        const collector = question.createReactionCollector(filter, options);
    
                        const currentResponse = collected.array()[0].content;
        
                        collector.on('end', (collected, reason)=>{
                            if (reason == 'time'){
                                message.reply("You ran out of time.")
                            }
                            else{
                                let userReaction = collected.array()[0];
                                let emoji = userReaction._emoji.name;
        
                                if (emoji === '👍'){
                                    responses.push(currentResponse)
                                    if (questionNumber < 4){
                                        startCompQuestions()
                                    }
                                    else{
                                        sendEmbed()
                                        responses = []
                                    }
    
                                }
                                else if (emoji === '👎'){
                                    startCompQuestions()
                                }
                                else {
                                    message.reply(`You can not respond with ${emoji}!`);
                                }
                            }
                        })
                    }         
                    confirmQuestions()   
                })
            }
        })
        message.reply(questions[questionNumber]);


        async function sendEmbed(){

            const embedChannel = bot.channels.cache.get("820036372060307517")

            if (isNaN(responses[2])){
                message.reply("The value you entered for the maximum players is not a number.\nTry again.")
            }
            else if (parseInt(responses[2]) < 1){
                message.reply("The value you entered for the maximum players is less than 1.\n Please try again with a value of at least 1.")
            }
            else if (responses[0].substring(0,19) == "Ended Competition: "){
                message.reply("That competition name is not allowed!\nPlease try again with a different name.")
            }
            else{
                embed = new MessageEmbed()
                .setColor('#FFB6C1')
                .setTitle(responses[0])
                .setDescription(responses[1])
                .addFields(
                    { name: 'Maximum number of players: ', value: responses[2] },
                    { name: 'Rewards: ', value: responses[3] },
                    { name: 'Tracks: ', value: responses[4] },
                    { name: 'Participants', value: '-'}
                )
    
    
                embedChannel.send(embed);
                
                message.reply("Competition successfully created!")
            } 
        }
    }

    function editCompQuestions(msg, oldEmbed){

        message.reply(`What would you like to edit for the competition "${oldEmbed.title}"?\n1. Title\n2. Description\n3. Maximum number of players\n4. Rewards\n5. Tracks`)
            .then((question) =>{
                question.react('1️⃣')
                question.react('2️⃣')
                question.react('3️⃣')
                question.react('4️⃣')
                question.react('5️⃣')

                var newTitle = oldEmbed.title;
                var newDescription = oldEmbed.description;
                var newMaxPlayers = oldEmbed.fields[0].value
                var newRewards = oldEmbed.fields[1].value
                var newTracks = oldEmbed.fields[2].value
                const participants = oldEmbed.fields[3].value


                filter = (reaction, user) => {
                    return ['1️⃣', '2️⃣', '3️⃣', '4️⃣','5️⃣'].includes(reaction.emoji.name) && !user.bot;
                }

                options = {
                    max: 1,
                    time: 15000
                }

                const collector = question.createReactionCollector(filter, options);

                collector.on('end', (collected, reason)=>{
                    

                    function edit(editChoice){
                        filter = (msg) => !msg.author.bot
                        options = {
                            max: 1,
                            time: 60000
                        }
                    
                        editCollector = message.channel.createMessageCollector(filter, options)
                    
                        editCollector.on('end', (collected, reason) =>{
                            if (reason == 'time'){
                                question.reply("You ran out of time.")
                                buttonSelected = false
                            }
                            else{
                                if (editChoice == 1){
                                    oldTitle = newTitle
                                    newTitle = collected.array()[0].content
                                    channel = bot.channels.cache.get("820036372060307517");
                                    channel.messages.fetch({limit : 100}).then(messages => {
                                        messages.forEach(msg => {
                                            for (var i = 0; i < msg.embeds.length; i++){
                                                if (newTitle == msg.embeds[i].title){
                                                    msg.reply("That title belongs to another competition!")
                                                    newTitle = oldTitle
                                                    return;
                                                }
                                            }
                            
                                        });
                                    });
                                }
                                else if (editChoice == 2){
                                    newDescription = collected.array()[0].content
                                }
                                else if (editChoice == 3){
                                    newMaxPlayers = collected.array()[0].content
                                }
                                else if (editChoice == 4){
                                    newRewards = collected.array()[0].content
                                }
                                else if (editChoice == 5){
                                    newTracks = collected.array()[0].content
                                }
                                performEdit()
                            }
                            
                        })
                    }

                    if (reason == 'time'){
                        message.reply("You ran out of time.")
                        buttonSelected = false
                    }
                    else{
                        let userReaction = collected.array()[0];
                        let emoji = userReaction._emoji.name;

                        if (emoji === '1️⃣'){
                            message.reply("What do you want the new title to be? ")
                            edit(1)
                        }

                        else if (emoji === '2️⃣'){
                            message.reply("What do you want the new description to be? ")
                            edit(2)
                        }

                        else if (emoji === '3️⃣'){
                            message.reply("What do you want the new maximum number of players to be? ")
                            edit(3)
                        }

                        else if (emoji === '4️⃣'){
                            message.reply("What do you want the new rewards to be? ")
                            edit(4)
                        }

                        else if (emoji === '5️⃣'){
                            message.reply("What do you want the new tracks to be? ")
                            edit(5)
                        }

                        else {
                            buttonSelected = false
                            message.reply(`You can not respond with ${emoji}!`);
                        }

                    }

                    function performEdit(){


                        if (isNaN(newMaxPlayers)){
                            message.reply("The value you entered for the maximum players is not a number.\nTry again.")
                        }
                        else if (parseInt(newMaxPlayers) < participants.split(/\r\n|\r|\n/).length - 1){
                            message.reply("The number of maximum players entered is lower than the current number of participants.\nRemove some participants to lower the maximum player count.")
                        }
                        else if (newTitle.substring(0,19) == "Ended Competition: "){
                            message.reply("That competition name is not allowed!\nPlease try again with a different name.")
                        }
                        else{
                            const newEmbed = new MessageEmbed()
                            .setColor('#FFB6C1')
                            .setTitle(newTitle)
                            .setDescription(newDescription)
                            .addFields(
                                { name: 'Maximum number of players: ', value: newMaxPlayers },
                                { name: 'Rewards: ', value: newRewards },
                                { name: 'Tracks: ', value: newTracks },
                                { name: 'Participants: ', value: participants}
                            )
                            msg.edit(newEmbed)
    
                            message.reply("Successfully edited the competition!")
                        }
                    }

                })
            })
        }
    

    function startJoin(username){

        function joinComp(msg, embedToEdit){
            const newEmbed = new MessageEmbed()
            .setColor('#FFB6C1')
            .setTitle(embedToEdit.title)
            .setDescription(embedToEdit.description)
            .addFields(
                { name: 'Maximum number of players: ', value: embedToEdit.fields[0].value },
                { name: 'Rewards: ', value: embedToEdit.fields[1].value },
                { name: 'Tracks: ', value: embedToEdit.fields[2].value },
                { name: 'Participants: ', value: embedToEdit.fields[3].value + "\n" + username}
            )
            msg.edit(newEmbed)

            message.reply(`You have joined the competition: "${embedToEdit.title}"`)
        }


        channel = bot.channels.cache.get("820036372060307517");
        channel.messages.fetch({limit : 100}).then(messages => {
            messages.forEach(msg => {
                for (var i = 0; i < msg.embeds.length; i++){
                    if (args.join(' ') == msg.embeds[i].title){
                        if (!msg.embeds[i].fields[3].value.includes(username)){
                            if (msg.embeds[i].fields[3].value.split(/\r\n|\r|\n/).length <= parseInt(msg.embeds[i].fields[0].value)){
                                try{
                                    if (msg.embeds[i].fields[4].value != undefined){
                                        message.reply("You can not join a competition which has already ended!")
                                    }
                                }
                                catch{
                                    joinComp(msg, msg.embeds[i])
                                }
                            }
                            else{
                                message.reply("This competition is full!")
                            }
                        }
                        else{
                            message.reply(`You are already a participant of the competition: "${msg.embeds[i].title}"`)
                        }
                    }
                }

            });
        });
    }

        function startLeave(username){

            function leaveComp(msg, embedToEdit){

                newParticipants = embedToEdit.fields[3].value.replace(username,'')

                try{
                    const newEmbed = new MessageEmbed()
                    .setColor('#FFB6C1')
                    .setTitle(embedToEdit.title)
                    .setDescription(embedToEdit.description)
                    .addFields(
                        { name: 'Maximum number of players: ', value: embedToEdit.fields[0].value },
                        { name: 'Rewards: ', value: embedToEdit.fields[1].value },
                        { name: 'Tracks: ', value: embedToEdit.fields[2].value },
                        { name: 'Participants: ', value: newParticipants}
                    )
                    msg.edit(newEmbed)
                }
                catch{
                    const newEmbed = new MessageEmbed()
                    .setColor('#FFB6C1')
                    .setTitle(embedToEdit.title)
                    .setDescription(embedToEdit.description)
                    .addFields(
                        { name: 'Maximum number of players: ', value: embedToEdit.fields[0].value },
                        { name: 'Rewards: ', value: embedToEdit.fields[1].value },
                        { name: 'Tracks: ', value: embedToEdit.fields[2].value },
                        { name: 'Participants: ', value: '-'}
                    )
                    msg.edit(newEmbed)
                }



                message.reply(`You have left the competition: "${embedToEdit.title}"`)
            }


            channel = bot.channels.cache.get("820036372060307517");
            channel.messages.fetch({limit : 100}).then(messages => {
                messages.forEach(msg => {
                    for (var i = 0; i < msg.embeds.length; i++){
                        if (args.join(' ') == msg.embeds[i].title){
                            if (msg.embeds[i].fields[3].value.includes(username)){
                                try{
                                    if (msg.embeds[i].fields[4].value != undefined){
                                        message.reply("You can not leave a competition which has ended!")
                                    }
                                }
                                catch{
                                    leaveComp(msg, msg.embeds[i])
                                }
                            }
                            else{
                                message.reply(`You are not a participant of the competition: "${msg.embeds[i].title}".\nTo join the competition use -join followed by the competition name.`)
                            }
                        }
                    }

                });
            });
        }

        function startRemove(username, compName){

            function removeFromComp(msg, embedToEdit){

                newParticipants = embedToEdit.fields[3].value.replace(username.slice(0, -1),'')

                try{
                    const newEmbed = new MessageEmbed()
                    .setColor('#FFB6C1')
                    .setTitle(embedToEdit.title)
                    .setDescription(embedToEdit.description)
                    .addFields(
                        { name: 'Maximum number of players: ', value: embedToEdit.fields[0].value },
                        { name: 'Rewards: ', value: embedToEdit.fields[1].value },
                        { name: 'Tracks: ', value: embedToEdit.fields[2].value },
                        { name: 'Participants: ', value: newParticipants}
                    )
                    msg.edit(newEmbed)
                }
                catch{
                    const newEmbed = new MessageEmbed()
                    .setColor('#FFB6C1')
                    .setTitle(embedToEdit.title)
                    .setDescription(embedToEdit.description)
                    .addFields(
                        { name: 'Maximum number of players: ', value: embedToEdit.fields[0].value },
                        { name: 'Rewards: ', value: embedToEdit.fields[1].value },
                        { name: 'Tracks: ', value: embedToEdit.fields[2].value },
                        { name: 'Participants: ', value: '-'}
                    )
                    msg.edit(newEmbed)
                }



                message.reply(`The user: ${username}has been removed from the competition: "${embedToEdit.title}"`)
            }


            channel = bot.channels.cache.get("820036372060307517");
            channel.messages.fetch({limit : 100}).then(messages => {
                messages.forEach(msg => {
                    for (var i = 0; i < msg.embeds.length; i++){
                        if (compName == " " + msg.embeds[i].title){
                            if (msg.embeds[i].fields[3].value.includes(username.slice(0, -1))){
                                try{
                                    if (msg.embeds[i].fields[4].value != undefined){
                                        message.reply("You can not remove a participant from an ended competition!")
                                    }
                                }
                                catch{
                                    removeFromComp(msg, msg.embeds[i])
                                }
                            }
                            else{
                                message.reply(`The user: ${username}is not a participant of the competition: "${msg.embeds[i].title}".\nTo join the competition use -join followed by the competition name.`)
                            }
                        }
                    }

                });
            });
        }

    function endComp(compName, compEmbed, embedChannel, msg){

        var leaderboard = []

        compParticipants = compEmbed.fields[3].value.split("\n")

        for (i = 0; i < compParticipants.length - 1; i++){
            leaderboard.push([])
        }


        function generateLeaderboard(){
            leaderboard.sort(function(a, b){return b[1] - a[1]})

            if (leaderboard.length == 1) {
                leaderboardString = `🥇 ${leaderboard[0][0]} with ${leaderboard[0][1]} points!\n`
            }
            else if (leaderboard.length == 2){
                leaderboardString = `🥇 ${leaderboard[0][0]} with ${leaderboard[0][1]} points!\n🥈 ${leaderboard[1][0]} with ${leaderboard[1][1]} points!\n`
            }
            else if (leaderboard.length >= 3){
                leaderboardString = `🥇 ${leaderboard[0][0]} with ${leaderboard[0][1]} points!\n🥈 ${leaderboard[1][0]} with ${leaderboard[1][1]} points!\n🥉 ${leaderboard[2][0]} with ${leaderboard[2][1]} points!`
            }

            for (i = 3; i < 10; i++){
                if (leaderboard.length >= i){
                    leaderboardString += `\n${i+1}th: ${leaderboard[i][0]} with ${leaderboard[i][1]} points!`
                }
            }

            const newEmbed = new MessageEmbed()
            .setColor('#FFB6C1')
            .setTitle("Ended Competition: " + compEmbed.title)
            .setDescription(compEmbed.description)
            .addFields(
                { name: 'Maximum number of players: ', value: compEmbed.fields[0].value },
                { name: 'Rewards: ', value: compEmbed.fields[1].value },
                { name: 'Tracks: ', value: compEmbed.fields[2].value },
                { name: 'Participants: ', value: compEmbed.fields[3].value },
                { name: 'Leaderboard: ', value : leaderboardString}
            )
            msg.delete()
            embedChannel.send(newEmbed)
        }

        count = 0

        function end(){
            filter = (message) => !message.author.bot
            options = {
                max: 1,
                time: 60000
            }

            collector = message.channel.createMessageCollector(filter, options)
    
            collector.on('end', (collected, reason) =>{
                if (reason == 'time'){
                    message.reply("You ran out of time.")
                }
                else{
                    pointValue = parseInt(collected.array()[0].content)   
                    
                    if (!isNaN(pointValue)){
                        leaderboard[count].push(compParticipants[count+1])
                        leaderboard[count].push(pointValue)
                        count += 1
                        if (count < compParticipants.length - 1){
                            end()
                        }
                        else{
                            message.reply("Are you sure all values entered are correct?")
                            .then((question) =>{
                                question.react('👍')
                                question.react('👎')
                                filter = (reaction, user) => {
                                    return ['👍','👎'].includes(reaction.emoji.name) && !user.bot;
                                }
                                
                                options = {
                                    max: 1,
                                    time: 60000
                                }

                                const collector = question.createReactionCollector(filter, options);
                                collector.on('end', (collected, reason)=>{
                                    if (reason == 'time'){
                                        message.reply("You ran out of time.")
                                    }
                                    else{
                                        let userReaction = collected.array()[0];
                                        let emoji = userReaction._emoji.name;
                    
                                        if (emoji === '👍'){
                                            message.reply("Thank you for submitting the results.\nThe leaderboard has been generated.")
                                            generateLeaderboard()
                                        }
                                        else if (emoji === '👎'){
                                            message.reply(`Understood. The competition "${compName}" will not be ended with these values.\nDo -endcomp again to try again with the correct values.`)
                                            return;
                                        }
                                        else {
                                            message.reply(`You can not respond with ${emoji}!`);
                                        }
                                    }
                                })
                            })
                        }
                    }
                    else{
                        message.reply("You can only enter numbers for points.\nTry again.")
                        end()
                    }
                }
            })
            leaderboardCount = leaderboard.length + 1

            message.reply(`How many points did ${compParticipants[count+1]} get?`)
        }


        function confirmEnd(){
            message.reply(`Are you sure you want to end the competition "${compName}"?`)
            .then((question) =>{
                question.react('👍')
                question.react('👎')
    
                filter = (reaction, user) => {
                    return ['👍','👎'].includes(reaction.emoji.name) && !user.bot;
                }
    
                options = {
                    max: 1,
                    time: 60000
                }
    
    
                const collector = question.createReactionCollector(filter, options);
    
                collector.on('end', (collected, reason)=>{
                    if (reason == 'time'){
                        message.reply("You ran out of time.")
                    }
                    else{
                        let userReaction = collected.array()[0];
                        let emoji = userReaction._emoji.name;
    
                        if (emoji === '👍'){
                            end()
                        }
                        else if (emoji === '👎'){
                            message.reply(`Understood. The competition "${compName}" will not be ended.`)
                            return;
                        }
                        else {
                            message.reply(`You can not respond with ${emoji}!`);
                        }
                    }
                })
            })
        }
        confirmEnd()
    }

    if (command == 'startcomp'){
        if (message.member.roles.cache.some(r => r.name == "moderator")){
            startCompQuestions();
            }
        else{
            message.reply("You must be a moderator to use this command!");
            return;
        }
    }
    else if (command == 'editcomp'){
        if (message.member.roles.cache.some(r => r.name == "moderator")){
            channel = bot.channels.cache.get("820036372060307517");
            channel.messages.fetch({limit : 100}).then(messages => {
                messages.forEach(msg => {
                    for (var i = 0; i < msg.embeds.length; i++){
                        if (args.join(' ') == msg.embeds[i].title){
                            try{
                                if (msg.embeds[i].fields[4].value != undefined){
                                    message.reply("You can not edit a competition which has already ended!")
                                }
                            }
                            catch{
                                editCompQuestions(msg, msg.embeds[i])
                            }
                        }
                    }
    
                });
            });
            }
        else{
            message.reply("You must be a moderator to use this command!");
            return;
        }

    }
    else if (command == 'join'){
        if (message.member.roles.cache.some(r => r.name == "v!bes Member")){
            startJoin(message.member.displayName);
            }
        else{
            message.reply("You must have @v!bes Member role to use this command!");
            return;
        }
    }

    else if (command == 'leave'){
        if (message.member.roles.cache.some(r => r.name == "v!bes Member")){
            startLeave(message.member.displayName);
            }
        else{
            message.reply("You must have @v!bes Member role to use this command!");
            return;
        }
    }

    else if (command == 'remove'){
        if (message.member.roles.cache.some(r => r.name == "moderator")){
            if (args.join(' ') != null){
                try{
                    if (msg.embeds[i].fields[4].value != undefined){
                        message.reply("This competition has already been ended!")
                    }
                }
                catch{
                    splitArgs = args.join(' ').split("from")
                    playerName = splitArgs[0]
                    compName = splitArgs[1]
                    startRemove(playerName, compName);
                }
            }
            }
        else{
            message.reply("You must be a moderator to use this command!");
            return;
        }
    }

    else if (command == 'endcomp'){
        if (message.member.roles.cache.some(r => r.name == "moderator")){
            if (args.join(' ') != null){
                channel = bot.channels.cache.get("820036372060307517");
                channel.messages.fetch({limit : 100}).then(messages => {
                    messages.forEach(msg => {
                        for (var i = 0; i < msg.embeds.length; i++){
                            if (args.join(' ') == msg.embeds[i].title){
                                try{
                                    if (msg.embeds[i].fields[4].value != undefined){
                                        message.reply("This competition has already been ended!")
                                    }
                                }
                                catch{
                                    endComp(args.join(' '), msg.embeds[i], channel, msg)
                                }
                            }
                        }
                    });
                });
            }
            }
        else{
            message.reply("You must be a moderator to use this command!");
            return;
        }
    }
})


bot.login(process.env.DISCORD_TOKEN_ID)