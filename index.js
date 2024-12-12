require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const app = express()

const Person = require('./models/persons')

app.use(express.json())
//app.use(morgan('tiny')) Tarvitseeko tämän erikseen, niin että body käytetään VAIN http POST?
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))
morgan.token('body', (request, response) => JSON.stringify(request.body));

let persons = [
	{
		id: 1,
		name: "Arto Hellas",
		number: "040-123456"
	},
	{
		id: 2,
		name: "Ada Lovelace",
		number: "39-44-5323523"
	},
	{
		id: 3,
		name: "Dan Abramov",
		number: "12-43-234345"
	},
	{
		id: 4,
		name: "Mary Poppendick",
		number: "39-23-6423122"
	}
]

app.use(express.static('dist'))

const cors = require('cors')

app.use(cors())

app.get('/api/persons', (request, response) => {
	Person.find({}).then(persons => {
		response.json(persons)
	})
})

app.get('/info', (request, response) => { 
	response.send(`Phonebook has info for ${persons.length} people <br/> ${new Date()}` )
})

app.get('/api/persons/:id', (request, response) => {
	Person.findById(request.params.id).then(person => {
		if(person){
			response.json(person)
		} else {
			response.status(404).end()
		}
	}).catch(error => next(error))
})
	
		

app.delete('/api/persons/:id', (request, response) => {
	Person.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

const generateId = () => {
	const randomId = Math.floor(Math.random() * 1000000);
	return randomId+1 //+1 niin ei 0 vaikkei taida olla tarpeellinen (mahdollisuus kuitenkin 1/1000000)
}

app.post('/api/persons', (request, response) => {
	const body = request.body

	if (!body.name || !body.number) {
		return response.status(400).json({ 
		  error: 'name or number missing' //Yhteen erroriin yksinkertaisuuden nimessä, voisi tietysti olla erikseen
		})
	}

	if (persons.find(person => person.name === body.name)){
		return response.status(400).json({ 
			error: 'name must be unique'  //Tarvitseeko nämä olla errorhandlerissä? Kun eivät ole varsinaisia erroreita.
		  })
	}

	const person = new Person({
		name: body.name,
		number: body.number
	})

	person.save().then(savedPerson => {
		response.json(savedPerson)
	})

})

app.put('/api/persons/:id', (request, response, next) => {
	const body = request.body

	const person = {
		name: body.name,
		number: body.number,
	}

	Person.findByIdAndUpdate(request.params.id, person, { new: true})
	.then(updatePerson => {
		response.json(updatePerson)
	})
	.catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
	response.status(404).send({ error: 'unknown endpoint' })
  }

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
	console.error(error.message)
  
	if (error.name === 'CastError') {
	  return response.status(400).send({ error: 'malformatted id' })
	}
  
	next(error)
  }
  
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})