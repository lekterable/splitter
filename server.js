const { ApolloServer, gql } = require('apollo-server')
const { GraphQLScalarType } = require('graphql')
const { Kind } = require('graphql/language')

const expenses = [
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

const householders = [
  { id: '1', name: 'Joey', email: 'joey@gmail.com', password: 'joey123' },
  { id: '2', name: 'Chandler', email: 'chand@gmail.com', password: 'chand123' },
  { id: '3', name: 'Monica', email: 'monica@gmail.com', password: 'monica123' },
  { id: '4', name: 'Rachel', email: 'rachel@gmail.com', password: 'rachel123' },
  { id: '5', name: 'Ross', email: 'ross@gmail.com', password: 'ross123' },
  { id: '6', name: 'Phoebe', email: 'phoebe@gmail.com', password: 'phoebe123' }
]

const households = [
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
    expenses(householder: String, household: String): [Expense]
    householder(id: String!): Householder
    household(id: String!): Household
  }
`

const resolvers = {
  Date: new GraphQLScalarType({
    name: 'Date',
    parseValue(value) {
      return new Date(value)
    },
    serialize(value) {
      return value.getTime()
    },
    parseLiteral({ kind, value }) {
      if (kind === Kind.INT) return Number(value)
      return null
    }
  }),
  Expense: {
    householder: root =>
      householders.find(householder => householder.name === root.householder),
    household: root =>
      households.find(household => household.name === root.household)
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
    expenses: (_, { householder, household }) => {
      if (householder)
        return expenses.filter(expense => expense.householder === householder)
      else if (household)
        return expenses.filter(expense => expense.household === household)
      else throw new Error('Specify householder or household')
    },
    householder: (_, { id }) =>
      householders.find(householder => householder.id === id),
    household: (_, { id }) => households.find(household => household.id === id)
  }
}

const server = new ApolloServer({ typeDefs, resolvers })

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
