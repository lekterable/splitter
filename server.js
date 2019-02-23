const { ApolloServer, gql } = require('apollo-server')

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

const resolvers = {}

const server = new ApolloServer({ typeDefs, resolvers })

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
