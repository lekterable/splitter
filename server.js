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
    member: '1',
    group: '1',
    cost: 100
  },
  {
    id: '2',
    date: 1550871884000,
    type: 'OTHER',
    member: '1',
    group: '1',
    cost: 100
  }
]

let members = [
  { id: '1', name: 'Joey', email: 'joey@gmail.com', password: 'joey123' },
  { id: '2', name: 'Chandler', email: 'chand@gmail.com', password: 'chand123' },
  { id: '3', name: 'Monica', email: 'monica@gmail.com', password: 'monica123' },
  { id: '4', name: 'Rachel', email: 'rachel@gmail.com', password: 'rachel123' },
  { id: '5', name: 'Ross', email: 'ross@gmail.com', password: 'ross123' },
  { id: '6', name: 'Phoebe', email: 'phoebe@gmail.com', password: 'phoebe123' }
]

let groups = [
  {
    id: '1',
    owner: '2',
    name: 'Apartment no. 19',
    members: ['1', '2']
  },
  {
    id: '2',
    owner: '3',
    name: 'Apartment no. 20',
    members: ['3', '4']
  },
  {
    id: '3',
    owner: '5',
    name: 'Apartment no. 3B',
    members: ['5']
  },
  {
    id: '4',
    owner: '6',
    name: 'Apartment no. 14',
    members: ['6']
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
    member: Member!
    group: Group!
    cost: Int!
  }

  type Member {
    id: String!
    name: String!
    email: String!
    expenses: [Expense]
    groups: [Group]
  }

  type Group {
    id: String!
    owner: Member!
    name: String!
    expenses: [Expense]
    members: [Member]
  }

  type Query {
    me: Member
    expense(id: String!): Expense
    expenses(member: String, group: String): [Expense]
    member(id: String!): Member
    group(id: String!): Group
    groups: [Group]
  }

  type Mutation {
    login(email: String!, password: String!): String!
    register(name: String!, email: String!, password: String!): String!
    addExpense(
      date: Date!
      description: String
      type: ExpenseType!
      group: String!
      cost: Int!
    ): Expense!
    addGroup(name: String!): Group!
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
    member: root => members.find(member => member.id === root.member),
    group: root => groups.find(group => group.id === root.group)
  },
  Member: {
    expenses: ({ id }) => expenses.filter(expense => expense.member === id),
    groups: ({ id }) =>
      groups.filter(group => group.members.some(member => member === id))
  },
  Group: {
    owner: ({ owner }) => members.find(member => member.id === owner),
    expenses: ({ id }) => expenses.filter(expense => expense.group === id),
    members: root =>
      root.members.map(rootMember =>
        members.find(member => member.id === rootMember)
      )
  },
  Query: {
    me: (_, __, { user }) => (user ? user : null),
    expense: (_, { id }) => expenses.find(expense => expense.id === id),
    expenses: (_, { member, group }) => {
      if (member) return expenses.filter(expense => expense.member === member)
      else if (group) return expenses.filter(expense => expense.group === group)
      else throw new Error('Specify member or group')
    },
    member: (_, { id }) => members.find(member => member.id === id),
    group: (_, { id }) => groups.find(group => group.id === id),
    groups: (_, __, { user }) =>
      groups.filter(group => group.members.some(member => member === user.id))
  },
  Mutation: {
    login: (_, { email, password }) => {
      const member = members.find(member => member.email === email)
      if (!member || member.password !== password)
        throw new Error('User not found')

      return jwt.sign({ id: member.id }, process.env.JWT_SECRET)
    },
    register: (_, { name, email, password }) => {
      const member = {
        id: String(members.length + 1),
        name,
        email,
        password
      }

      members = [...members, member]
      return jwt.sign({ id: member.id }, process.env.JWT_SECRET)
    },
    addExpense: (_, { date, description, type, group, cost }, { user }) => {
      const expense = {
        id: String(expenses.length + 1),
        date,
        description,
        type,
        member: user.id,
        group,
        cost
      }

      expenses = [...expenses, expense]
      return expense
    },
    addGroup: (_, { name }, { user }) => {
      const group = {
        id: String(groups.length + 1),
        owner: user.id,
        name,
        members: [user.id]
      }

      groups = [...groups, group]
      return group
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
        const user = members.find(member => member.id === decoded.id)
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
