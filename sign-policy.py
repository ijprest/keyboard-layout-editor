import base64
import hmac, hashlib

f = open('aws-private-key.txt','rt')
AWS_SECRET_ACCESS_KEY = f.read()
f = open('upload-policy.txt','rt')

policy_document = f.read()
policy_document = policy_document.replace("\n","").replace("\r","").replace("\t","").replace(" ","");
policy = base64.b64encode(policy_document)
signature = base64.b64encode(hmac.new(AWS_SECRET_ACCESS_KEY, policy, hashlib.sha1).digest())

print "Signing Policy:", policy_document
print "Using secret key:", AWS_SECRET_ACCESS_KEY
print
print "Policy:", policy
print "Signature:", signature