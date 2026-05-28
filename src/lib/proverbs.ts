/**
 * @fileOverview Centralized library of proverbs and quotes related to integrity and democracy.
 */

export const PROVERBS = [
  {
    text: "The ballot is stronger than the bullet.",
    author: "Abraham Lincoln"
  },
  {
    text: "Voting is not only our right—it is our power.",
    author: "Loung Ung"
  },
  {
    text: "Bad officials are elected by good citizens who do not vote.",
    author: "George Jean Nathan"
  },
  {
    text: "The ignorance of one voter in a democracy impairs the security of all.",
    author: "John F. Kennedy"
  },
  {
    text: "A citizen’s greatest tool for change is the vote.",
    author: "OOTU Protocol"
  },
  {
    text: "Voting is the expression of our commitment to ourselves and one another.",
    author: "Sharon Salzberg"
  },
  {
    text: "Integrity is doing the right thing, even when no one is watching.",
    author: "C.S. Lewis"
  }
];

export function getRandomProverb() {
  return PROVERBS[Math.floor(Math.random() * PROVERBS.length)];
}
