const { ApolloServer, gql } = require('apollo-server')

const typeDefs = gql`
  type Expense {
    id: String!
  }

  type Householder {
    id: String!
  }

  type Household {
    id: String!
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
