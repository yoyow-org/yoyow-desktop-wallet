# Voting
YOYOW uses the DPOS consensus algorithm. All token holders are able to choose witnesses and the committee through the voting system, allowing them to make decisions about the YOYOW system.

## Voting Qualification
- Voting qualification is assigned to those holders owning an amount ‘N’ of tokens. If the amount of tokens owned by a holder is lower than N, the holder will automatically be disqualified from voting. The current N value = 10,000, which can be modified by the committee.
- Accounts included in the committee’s blacklist are disqualified from voting.


## Intention to Vote
- Users qualified for voting will activate their intention to vote when they vote for the first time. The validity period is T, which is initially set at 90 days.
- If there is any new voting action within the validity period, it will be extended by T, which means, the expiry date will be changed to: the date of the updated voting action + T.
- If there is no new voting action within the validity period, it is assumed that there is no more voting intention.
- If users are disqualified from voting, or have no more voting intention, their votes will become void.

## Voting Method
- Committee elections: one vote for one candidate—each account can only support one candidate at one time, and the voter can change the vote at any time
- Witness elections: one vote for numerous candidates—to strengthen consensus, each account can vote for numerous witnesses.


## Vote Counting
- To enhance the fairness of voting, vote counting also takes into consideration the voters’ number of tokens held, average token volume, time held and other factors.
- The number of valid votes is equal to average balance over 60 days, or the current balance of the account (whichever is smaller), which means: number of valid votes = min (average balance within 60 days, current balance)
- The number of votes for a candidate is equal to the total number of valid votes from supporters.
- As it takes a lot of effort to count based on the age of the tokens in all accounts, which are updated in real-time, a delayed updating mode is used for vote counting, which means there might be a few deviations from counting based on real-time statistics. 


## Voting Proxies
- A proxy can be designated for voting activities. For example: when Account A designates Account B as voting proxy, the voter of Account B will receive the valid vote(s) from both A and B. In this case, A is the client and B is the proxy.
- Multi-layered proxies are allowed. For example: Account A designates Account B as its voting proxy, and Account B designates Account C as its voting proxy. However, there are restrictions on the total number of proxy layers.
- Whenever there is an action of proxy voting, the validity period of the client’s intention to vote will be updated.
- When the proxy has no intention to vote or no qualification to vote, the proxy relationship will be automatically terminated, and the client’s voting status will be changed to “with no vote for anyone” while the validity period of the client’s intention to vote remains the same.
- When a proxy reactivates their intention to vote, the proxy relationship is not recovered.
