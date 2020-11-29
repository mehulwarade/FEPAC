#!/usr/bin/env python

from mpi4py import MPI
import sys
import numpy as np
np.seterr(over='ignore') #Suppresses the warning like the 'RuntimeWarning: overflow encountered in ubyte_scalars'
from time import time
import os
thisdirname = os.path.dirname(os.path.abspath(__file__))
# size = int(sys.argv[1])
size = 36
TaskMaster = 0

#print ("Initialising variables.\n")
a = np.loadtxt(os.path.join(thisdirname,'arrays/%s.1.array' %size), dtype='uint8')
b = np.loadtxt(os.path.join(thisdirname,'arrays/%s.1.array' %size), dtype='uint8')
c = np.zeros(shape=(size), dtype='uint8')

comm = MPI.COMM_WORLD
worldSize = comm.Get_size()
rank = comm.Get_rank()
processorName = MPI.Get_processor_name()
#Calculate the slice per worker
if (worldSize == 1):
    slice = size
else:
    slice = int(size / (worldSize-1)) #make sure it is divisible

assert slice >= 1
comm.Barrier()

t = time()

if rank == TaskMaster:
    # print ("Initialising Matrix A and B (%d,%d).\n" % (size, size))
    for i in range(1, worldSize):
        offset = (i-1)*slice
        row = a[offset,:]
        comm.send(offset, dest=i, tag=i)
        comm.send(row, dest=i, tag=i)
        for j in range(0, slice):
            comm.send(a[j+offset,:], dest=i, tag=j+offset)
    # print ("All sent to workers.\n")

comm.Barrier()

if (rank != TaskMaster):

    # print ("Data Received from process %d.\n" % (rank))
    offset = comm.recv(source=0, tag=rank)
    recv_data = comm.recv(source=0, tag=rank)
    for j in range(1, slice):
        c = comm.recv(source=0, tag=j+offset)
        recv_data = np.vstack((recv_data, c))

    # print ("Start Calculation from process %d.\n" % (rank))

    #Loop through rows
    t_start = MPI.Wtime()
    for i in range(0, slice):
        res = np.zeros(shape=(size), dtype='uint8')
        if (slice == 1):
            r = recv_data
        else:
            r = recv_data[i,:]
        ai = 0
        for j in range(0, size):
            q = b[:,j] #get the column we want
            for x in range(0, size):
                res[j] = res[j] + (r[x]*q[x])
                # If : RuntimeWarning: overflow encountered in ubyte_scalars
                # Refer: https://stackoverflow.com/a/32928763 
            ai = ai + 1
        if (i > 0):
           send = np.vstack((send, res))
        else:
            send = res
    t_diff = MPI.Wtime() - t_start
    comm.Send([send, MPI.FLOAT], dest=0, tag=rank)

# comm.Barrier()

if rank == TaskMaster:  
    #print ("Checking response from Workers.\n")
    res1 = np.zeros(shape=(slice, size), dtype='uint8')
    comm.Recv([res1, MPI.FLOAT], source=1, tag=1)
    #print ("Received response from 1.\n")
    kl = np.vstack((res1))
    for i in range(2, worldSize):
        resx= np.zeros(shape=(slice, size), dtype='uint8')
        comm.Recv([resx, MPI.FLOAT], source=i, tag=i)
        #print ("Received response from %d.\n" % (i))
        kl = np.vstack((kl, resx))
    # print ("End")
    #mpirun --hostfile machinefile -np 3 python3 matrixmultiplication.py 120 ##### check result
    # print (kl)  
    
    delta = time() - t
    # print('Start: %d End: %d Total: %d'%(t,time(),delta))
    print(delta)

    del a, b, c






