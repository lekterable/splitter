const { ApolloServer, gql } = require('apollo-server')
const { GraphQLScalarType } = require('graphql')
const { Kind } = require('graphql/language')
const jwt = require('jsonwebtoken')

let expenses = [
  {
    id: '1',
    date: 1550871882000,
    type: 'FOOD',
    description: 'Pizza',
    householder: '1',
    household: '1',
    cost: 100
  },
  {
    id: '2',
    date: 1550871884000,
    type: 'OTHER',
    householder: '1',
    household: '1',
    cost: 100
  }
]

let householders = [
  { id: '1', name: 'Joey', email: 'joey@gmail.com', password: 'joey123' },
  { id: '2', name: 'Chandler', email: 'chand@gmail.com', password: 'chand123' },
  { id: '3', name: 'Monica', email: 'monica@gmail.com', password: 'monica123' },
  { id: '4', name: 'Rachel', email: 'rachel@gmail.com', password: 'rachel123' },
  { id: '5', name: 'Ross', email: 'ross@gmail.com', password: 'ross123' },
  { id: '6', name: 'Phoebe', email: 'phoebe@gmail.com', password: 'phoebe123' }
]

let households = [
  {
    id: '1',
    owner: '2',
    name: 'Apartment no. 19',
    householders: ['1', '2']
  },
  {
    id: '2',
    owner: '3',
    name: 'Apartment no. 20',
    householders: ['3', '4']
  },
  {
    id: '3',
    owner: '5',
    name: 'Apartment no. 3B',
    householders: ['5']
  },
  {
    id: '4',
    owner: '6',
    name: 'Apartment no. 14',
    householders: ['6']
  }
]

const typeDefs = gql`
  scalar Date

  enum ExpenseType {
    FOOD
    BILLS
    ENTERTAINMENT
    OTHER
  }

  type Expense {
    id: String!
    date: Date!
    description: String
    type: ExpenseType!
    householder: Householder!
    household: Household!
    cost: Int!
  }

  type Householder {
    id: String!
    name: String!
    email: String!
    expenses: [Expense]
    households: [Household]
  }

  type Household {
    id: String!
    owner: Householder!
    name: String!
    expenses: [Expense]
    householders: [Householder]
  }

  type Query {
    me: Householder
    expense(id: String!): Expense
    expenses(householder: String, household: String): [Expense]
    householder(id: String!): Householder
    household(id: String!): Household
    households: [Household]
  }

  type Mutation {
    login(email: String!, password: String!): String!
    register(name: String!, email: String!, password: String!): String!
    addExpense(
      date: Date!
      description: String
      type: ExpenseType!
      householder: String!
      household: String!
      cost: Int!
    ): Expense!
    addHousehold(name: String!): Household!
  }
`

const resolvers = {
  Date: new GraphQLScalarType({
    name: 'Date',
    parseValue: value => value,
    serialize: value => value,
    parseLiteral: ({ kind, value }) => {
      if (kind === Kind.INT) return Number(value)
      throw new Error('Incorrect date format')
    }
  }),
  Expense: {
    householder: root =>
      householders.find(householder => householder.id === root.householder),
    household: root =>
      households.find(household => household.id === root.household)
  },
  Householder: {
    expenses: ({ id }) =>
      expenses.filter(expense => expense.householder === id),
    households: ({ id }) =>
      households.filter(household =>
        household.householders.some(householder => householder === id)
      )
  },
  Household: {
    owner: ({ owner }) =>
      householders.find(householder => householder.id === owner),
    expenses: ({ id }) => expenses.filter(expense => expense.household === id),
    householders: root =>
      root.householders.map(rootHouseholder =>
        householders.find(householder => householder.id === rootHouseholder)
      )
  },
  Query: {
    me: (_, __, { user }) => (user ? user : null),
    expense: (_, { id }) => expenses.find(expense => expense.id === id),
    expenses: (_, { householder, household }) => {
      if (householder)
        return expenses.filter(expense => expense.householder === householder)
      else if (household)
        return expenses.filter(expense => expense.household === household)
      else throw new Error('Specify householder or household')
    },
    householder: (_, { id }) =>
      householders.find(householder => householder.id === id),
    household: (_, { id }) => households.find(household => household.id === id),
    households: (_, __, { user }) =>
      households.filter(household =>
        household.householders.some(householder => householder === user.id)
      )
  },
  Mutation: {
    login: (_, { email, password }) => {
      const householder = householders.find(
        householder => householder.email === email
      )
      if (!householder || householder.password !== password)
        throw new Error('User not found')

      return jwt.sign(
        {
          id: householder.id
        },
        process.env.JWT_SECRET
      )
    },
    register: (_, { name, email, password }) => {
      const householder = {
        id: String(householders.length + 1),
        name,
        email,
        password
      }
      householders = [...householders, householder]

      return jwt.sign(
        {
          id: householder.id
        },
        process.env.JWT_SECRET
      )
    },
    addExpense: (
      _,
      { date, description, type, householder, household, cost }
    ) => {
      const expense = {
        id: String(expenses.length + 1),
        date,
        description,
        type,
        householder,
        household,
        cost
      }
      expenses = [...expenses, expense]
      return expense
    },
    addHousehold: (_, { name }, { user }) => {
      const household = {
        id: String(households.length + 1),
        owner: user.id,
        name,
        householders: [user.id]
      }
      households = [...households, household]
      return household
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers.authorization
    const bearer = 'Bearer '
    if (token && token.length > bearer.length) {
      try {
        const decoded = jwt.verify(
          token.replace(bearer, ''),
          process.env.JWT_SECRET
        )
        const user = householders.find(
          householder => householder.id === decoded.id
        )
        if (!user) throw new Error('User not found')
        return {
          user
        }
      } catch (err) {
        console.error(err.message)
      }
    }
    return {}
  }
})

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
