import { gql } from '@apollo/client'

export interface User {
  // Serialized as GraphQL Float — arrives as a JS number at runtime.
  id: number
  email: string
}

export interface AuthPayload {
  token: string
  user: User
}

export interface Post {
  // Serialized as GraphQL Float — arrives as a JS number at runtime.
  id: number
  title: string
  body: string
  createdAt: string
  author: User
}

export interface CreatePostInput {
  title: string
  body: string
}

export interface SignUpResult {
  signUp: AuthPayload
}

export interface SignInResult {
  signIn: AuthPayload
}

export interface MeResult {
  me: User
}

export interface PostsResult {
  posts: Post[]
}

export interface CreatePostResult {
  createPost: Post
}

export interface PostPublishedResult {
  postPublished: Post
}

export const SIGN_UP = gql`
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input) {
      token
      user {
        id
        email
      }
    }
  }
`

export const SIGN_IN = gql`
  mutation SignIn($input: SignInInput!) {
    signIn(input: $input) {
      token
      user {
        id
        email
      }
    }
  }
`

export const ME = gql`
  query Me {
    me {
      id
      email
    }
  }
`

export const POSTS = gql`
  query Posts {
    posts {
      id
      title
      body
      createdAt
      author {
        id
        email
      }
    }
  }
`

export const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      title
      body
      createdAt
      author {
        id
        email
      }
    }
  }
`

export const POST_PUBLISHED = gql`
  subscription PostPublished {
    postPublished {
      id
      title
      body
      createdAt
      author {
        id
        email
      }
    }
  }
`
